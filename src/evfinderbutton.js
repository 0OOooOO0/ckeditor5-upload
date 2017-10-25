/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module upload/evfinderbutton
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
//import ImageUploadEngine from './imageuploadengine';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Notification from '@ckeditor/ckeditor5-ui/src/notification/notification';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';
import { isImageType, findOptimalInsertionPosition } from './utils';

//import iframeView from '@ckeditor/ckeditor5-ui/src/iframe/iframeview'

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
		return [ Notification, ContextualBalloon ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;

		// Setup `insertImageEVFinder` button.
		editor.ui.componentFactory.add( 'insertImageEVFinder', locale => {
			const view = new ButtonView( locale );
			const command = editor.commands.get( 'imageUpload' );
			const notifi = new Notification( locale );
			notifi.showWarning('Hallo');

			view.set( {
				label: t( 'Insert image' ),
				icon: imageIcon,
				tooltip: true
			} );

			view.bind( 'isEnabled' ).to( command );

			view.on( 'done', ( evt, files ) => {
				notifi.showWarning('done');
				for ( const file of Array.from( files ) ) {
					const insertAt = findOptimalInsertionPosition( editor.document.selection );

					if ( isImageType( file ) ) {
						editor.execute( 'imageUpload', { file, insertAt } );
					}
				}
			} );

			return view;
		} );
	}

	_creatToolbarButton() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add('insertImageEVFinder', locale => {
			const button = new ButtonView(locale);
			
			button.isEnabled = true;
			button.label = t('Imsert image');
			button.icon = imageIcon,
			button.tooltip = true;
			
			return button;
		} ;
	}
}
