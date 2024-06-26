import { getOwner } from "@ember/application";
import { get, computed } from "@ember/object";
import { default as Service, inject as service } from "@ember/service";
import { quit } from "nwjs/App";
import { Clipboard, Shell } from "nwjs/nwGui";
import {
	default as nwWindow,
	toggleVisibility,
	toggleMaximized,
	toggleMinimized,
	toggleShowInTaskbar,
	setFocused,
	setVisibility,
	setShowInTaskbar
} from "nwjs/Window";
import { ATTR_GUI_INTEGRATION_TRAY } from "data/models/settings/gui/fragment";


const { hasOwnProperty } = {};
const reVariable = /{(\w+)}/g;
const modalCloseContext = {};


export default Service.extend( /** @class NwjsService */ {
	modal: service(),
	settings: service(),
	streaming: service(),


	/** @type {NWJS_Helpers.clip} */
	clipboard: computed(function() {
		return Clipboard.get();
	}),

	tray: computed(function() {
		return getOwner( this ).lookup( "nwjs:tray" );
	}),


	reload() {
		nwWindow.reloadIgnoringCache();
	},

	devTools() {
		nwWindow.showDevTools();
	},

	/**
	 * @param {string} url
	 * @param {Object<string,string>?} vars
	 * @returns {string}
	 */
	openBrowser( url, vars ) {
		if ( !url ) {
			throw new Error( "Missing URL" );
		}

		const hasVars = vars && typeof vars === "object";
		url = url.replace( reVariable, ( _, name ) => {
			if ( !hasVars || !hasOwnProperty.call( vars, name ) ) {
				throw new Error( `Missing value for key '${name}'` );
			}

			return vars[ name ];
		});

		Shell.openExternal( url );
	},

	minimize() {
		const { integration, minimizetotray } = this.settings.content.gui;

		// hide the window when in tray-only-mode or in both-mode with min2tray setting enabled
		if (
			   integration === ATTR_GUI_INTEGRATION_TRAY
			|| ( integration & ATTR_GUI_INTEGRATION_TRAY ) > 0
			&& minimizetotray
		) {
			toggleShowInTaskbar();
			toggleVisibility();
		} else {
			toggleMinimized();
		}
	},

	maximize() {
		toggleMaximized();
	},

	focus( focus = true ) {
		setFocused( focus );
	},

	close( fromTray = false ) {
		const { integration, closetotray } = this.settings.content.gui;
		const hasTray = ( integration & ATTR_GUI_INTEGRATION_TRAY ) > 0;

		if ( !fromTray && hasTray && closetotray ) {
			setShowInTaskbar( false );
			setVisibility( false );
		} else if ( this.streaming.hasStreams ) {
			setVisibility( true );
			setFocused( true );
			this.modal.openModal( "quit", modalCloseContext );
		} else {
			this.quit();
		}
	},

	quit() {
		quit();
	},

	setShowInTray( visible, removeOnClick ) {
		const tray = get( this, "tray" );
		if ( visible ) {
			tray._createTray();
			if ( removeOnClick ) {
				tray.one( "click", () => tray._removeTray() );
			}
		} else {
			tray._removeTray();
		}
	},

	/**
	 * @param {string?} label
	 */
	setBadgeLabel( label = "" ) {
		nwWindow.setBadgeLabel( `${label}` );
	},

	/**
	 * @param {MouseEvent} event
	 * @param {nw.MenuItem[]} items
	 */
	contextMenu( event, items ) {
		event.preventDefault();
		event.stopImmediatePropagation();

		const menu = getOwner( this ).lookup( "nwjs:menu" );
		menu.items.pushObjects( items );
		menu.menu.popup( Math.round( event.clientX ), Math.round( event.clientY ) );
	},

	addTrayMenuItem( item, position ) {
		const tray = get( this, "tray" );
		if ( position === undefined ) {
			tray.menu.items.unshiftObject( item );
		} else {
			tray.menu.items.insertAt( position, item );
		}
	},

	removeTrayMenuItem( item ) {
		const tray = get( this, "tray" );
		tray.menu.items.removeObject( item );
	}
});
