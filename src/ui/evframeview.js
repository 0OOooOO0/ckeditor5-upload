/**
 * @module upload/ui/evframeview
 */

import View from '@ckeditor/ckeditor5-ui/src/view';
import Template from '@ckeditor/ckeditor5-ui/src/template';

export default class EVFrameView extends View {

	constructor(locale, config) {
		super( locale );

		const bind = this.bindTemplate;
		config = config || {};

		this.template = new Template( {
			tag: 'iframe',
			attributes: {
				class: [ 'ck-reset_all' ],
				src: config.url || '',
				sandbox: 'allow-same-origin allow-scripts allow-forms allow-modals allow-top-navigation',
				style: config.style || 'width:640px;height:400px;'
			},
			on: {
				load: bind.to( 'loaded' )
			}
		} );

		this._iframePromise = new Promise( ( resolve, reject ) => {
			this._iframeDeferred = { resolve, reject };
		} );

		this.on( 'loaded', () => {
			this._iframeDeferred.resolve();
		} );
	}

	init() {
		super.init();

		return this._iframePromise;
	}
}

/**
 * Fired when the DOM iframe's `contentDocument` finished loading.
 *
 * @event loaded
 */
