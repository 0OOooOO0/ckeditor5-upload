/**
 * @module upload/evfinderbutton
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
//import ImageUploadEngine from './imageuploadengine';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';
import { isImageType, findOptimalInsertionPosition } from './utils';
import EVFinderView from './ui/evfinderview';
import EVFinderElement from './evfinderelement';
import EVFinderAddImageCommand from './evfinderaddimagecommand';


/**
 * Image upload button plugin.
 * Adds `insertImage` button to UI component factory.
 *
 * @extends module:core/plugin~Plugin
 */
export default class EVFinderButton extends Plugin {

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'EVFinderButton';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ContextualBalloon ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;
		editor.commands.add('evfinderAddImage', new EVFinderAddImageCommand(editor));

		this.formView = this._createForm();

		this._balloon = editor.plugins.get(ContextualBalloon);

		this._createToolbarButton(),

		this._attachActions();
	}

	_createForm() {
		const editor = this.editor;
		const formView = new EVFinderView(editor.locale, editor.config.get('evfinder'));

		// Hide the panel after clicking on formView `Cancel` button.
		this.listenTo( formView, 'cancel', () => this._hidePanel( true ) );

		// Close the panel on esc key press when the form has focus.
		formView.keystrokes.set( 'Esc', ( data, cancel ) => {
			this._hidePanel( true );
			cancel();
		} );

		return formView;
	}

	_createToolbarButton() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add('insertImageEVFinder', locale => {
			const button = new ButtonView(locale);
			
			button.isEnabled = true;
			button.label = t('Insert image');
			button.icon = imageIcon;
			button.tooltip = true;

			this.listenTo(button, 'execute', () => this._showPanel(true));

			return button;
		});
	}

	_attachActions() {
		const viewDocument = this.editor.editing.view;

		// Handle click on view document and show panel when selection is placed inside the link element.
		// Keep panel open until selection will be inside the same link element.
		this.listenTo(viewDocument, 'click', () => {
			const parentLink = this._getSelectedLinkElement();

			if (parentLink) {
				this._showPanel();
			}
		});

		// Focus the form if the balloon is visible and the Tab key has been pressed.
		this.editor.keystrokes.set( 'Tab', ( data, cancel ) => {
			if ( this._balloon.visibleView === this.formView && !this.formView.focusTracker.isFocused ) {
				this.formView.focus();
				cancel();
			}
		}, {
			priority: 'high'
		} );

		// Close the panel on the Esc key press when the editable has focus and the balloon is visible.
		this.editor.keystrokes.set( 'Esc', ( data, cancel ) => {
			if ( this._balloon.visibleView === this.formView ) {
				this._hidePanel();
				cancel();
			}
		} );

		// Close on click outside of balloon panel element.
		clickOutsideHandler( {
			emitter: this.formView,
			activator: () => this._balloon.hasView( this.formView ),
			contextElements: [ this._balloon.view.element ],
			callback: () => this._hidePanel()
		} );

	}

	_showPanel(focusInput) {
		const editor = this.editor;
		const editing = editor.editing;
		const showViewDocument = editing.view;
		const showIsCollapsed = showViewDocument.selection.isCollapsed;
		const showSelectedLink = this._getSelectedLinkElement();



		this.listenTo( showViewDocument, 'render', () => {
			const renderSelectedLink = this._getSelectedLinkElement();
			const renderIsCollapsed = showViewDocument.selection.isCollapsed;
			const hasSellectionExpanded = showIsCollapsed && !renderIsCollapsed;

			if ( hasSellectionExpanded || showSelectedLink !== renderSelectedLink ) {
				this._hidePanel( true );
			}

			else {
				this._balloon.updatePosition( this._getBalloonPositionData() );
			}
		} );

		if ( this._balloon.hasView( this.formView ) ) {
			// Check if formView should be focused and focus it if is visible.
			if ( focusInput && this._balloon.visibleView === this.formView ) {
				//this.formView.urlInputView.select();
			}
		} else {
			this._balloon.add( {
				view: this.formView,
				position: this._getBalloonPositionData()
			} );

			if ( focusInput ) {
				//this.formView.urlInputView.select();
			}
		}

	}

	_hidePanel( focusEditable ) {
		this.stopListening( this.editor.editing.view, 'render' );

		if ( !this._balloon.hasView( this.formView ) ) {
			return;
		}

		if ( focusEditable ) {
			this.editor.editing.view.focus();
		}

		this.stopListening( this.editor.editing.view, 'render' );
		this._balloon.remove( this.formView );
	}

	_getBalloonPositionData() {
		const viewDocument = this.editor.editing.view;
		const targetLink = this._getSelectedLinkElement();

		const target = targetLink ?
			// When selection is inside link element, then attach panel to this element.
			viewDocument.domConverter.mapViewToDom( targetLink ) :
			// Otherwise attach panel to the selection.
			viewDocument.domConverter.viewRangeToDom( viewDocument.selection.getFirstRange() );

		return { target };
	}

	_getSelectedLinkElement() {
		const selection = this.editor.editing.view.selection;

		if ( selection.isCollapsed ) {
			return findLinkElementAncestor( selection.getFirstPosition() );
		} else {
			// The range for fully selected link is usually anchored in adjacent text nodes.
			// Trim it to get closer to the actual LinkElement.
			const range = selection.getFirstRange().getTrimmed();
			const startLink = findLinkElementAncestor( range.start );
			const endLink = findLinkElementAncestor( range.end );

			if ( !startLink || startLink != endLink ) {
				return null;
			}

			// Check if the LinkElement is fully selected.
			if ( Range.createIn( startLink ).getTrimmed().isEqual( range ) ) {
				return startLink;
			} else {
				return null;
			}
		}
	}
}

function findLinkElementAncestor( position ) {
	return position.getAncestors().find( ancestor => ancestor instanceof EVFinderElement );
}