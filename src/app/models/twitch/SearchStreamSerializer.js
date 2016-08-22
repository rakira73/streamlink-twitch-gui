import TwitchSerializer from "store/TwitchSerializer";


	export default TwitchSerializer.extend({
		modelNameFromPayloadKey: function() {
			return "twitchSearchStream";
		},

		attrs: {
			stream: { deserialize: "records" }
		},

		normalizeResponse: function( store, primaryModelClass, payload, id, requestType ) {
			payload.streams = ( payload.streams || [] ).map(function( hash ) {
				return {
					stream: hash
				};
			});

			return this._super( store, primaryModelClass, payload, id, requestType );
		},

		normalize: function( modelClass, resourceHash, prop ) {
			var foreignKey = this.store.serializerFor( "twitchChannel" ).primaryKey;
			resourceHash[ this.primaryKey ] = resourceHash.stream.channel[ foreignKey ];

			return this._super( modelClass, resourceHash, prop );
		}
	});
