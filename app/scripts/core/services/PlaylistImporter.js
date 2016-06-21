(function(angular){
    'use strict';

    angular.module('soundcloudify.core')
        .service('PlaylistImporter', PlaylistImporter);

    var token_needed_urg = null;

    function PlaylistImporter($rootScope, $log, $q, $http, YOUTUBE_KEY, TrackAdapter){

        return {
            fetchPlaylist: fetchPlaylist,
            fetchPlaylistItems: fetchPlaylistItems,
            extractPlaylistId: extractPlaylistId
        };

        function extractPlaylistId(playlistUrl) {
            if (!playlistUrl) {
                $log.error('playlist url is missing');
                return;
            }

            var regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
            var match = playlistUrl.match(regExp);
            if (match && match[2]){
              console.log(match[2])
                return match[2];
            }
            return null;
        }

        function fetchPlaylist(playlistId) {
            return $q(function(resolve, reject) {

                if (!playlistId) {
                    $log.error('can not extract playlistId from the input');
                    reject();
                }

                //fetch playlist info
                var params = {
                    key: YOUTUBE_KEY,
                    part: 'id,snippet',
                    fields: 'items/id, items/snippet/title',
                    id: playlistId
                };

                chrome.identity.getAuthToken({
                    interactive: true
                }, function(token) {
                    console.log(token);
                    if (chrome.runtime.lastError) {
                        alert(chrome.runtime.lastError.message);
                        return;
                    }
                    $http({
                        url: 'https://www.googleapis.com/youtube/v3/playlists?access_token='+token,
                        method: 'GET',
                        params: params,
                    }).success(function(result) {
                        console.log("HERE");
                        if (!result || !result.items || !result.items.length) {
                            reject();
                            return;
                        }
                        token_needed_urg = token;
                        console.log(result);

                        var playlistName = result.items[0].snippet.title,
                            resolvedPlaylistId = result.items[0].id;

                        resolve({
                            id: resolvedPlaylistId,
                            name: playlistName
                        });

                    }).error(function(reason) {
                        console.log(reason);
                        reject();
                    });

                });



                });
        }

        function fetchPlaylistItems(playlistId, nextPageToken, allItems) {

            return $q(function(resolve, reject) {
                var parts = ['id', 'snippet'];
                var fields = [
                    'nextPageToken',
                    'items/snippet/title',
                    'items/snippet/thumbnails',
                    'items/snippet/resourceId'
                ];

                var playlistItemsRequestParams = {
                    key: YOUTUBE_KEY,
                    maxResults: 50,
                    part: parts.join(','),
                    fields: fields.join(','),
                    playlistId: playlistId,
                    pageToken: nextPageToken || ''
                };


                $http({
                    url: 'https://www.googleapis.com/youtube/v3/playlistItems?access_token='+token_needed_urg,
                    method: 'GET',
                    params: playlistItemsRequestParams,
                }).success(function(result) {
                    console.log(result);
                    if (!result || !result.items || !result.items.length) {
                        resolve([]);
                    }

                    var playlistItems = [];

                    _.each(result.items, function(item) {
                        console.log(item);
                        //some videos are removed. They don't get the title in the snippet
                        if (item.snippet && item.snippet.title && item.snippet.resourceId.videoId) {
                            playlistItems.push({
                                id: item.snippet.resourceId.videoId,
                                snippet: {
                                    title: item.snippet.title,
                                    thumbnails: item.snippet.thumbnails,
                                }
                            });
                        }
                    });
                    console.log("Kay here");
                    resolve({
                        items: TrackAdapter.adaptMultiple(playlistItems, 'yt'),
                        nextPageToken: result.nextPageToken
                    });

                }).error(function(reason) {
                    console.log(reason);
                    reject();
                });
            }).then(function(data) {

                allItems = (allItems || []).concat(data.items);

                if (data.nextPageToken) {
                    return fetchPlaylistItems(playlistId, data.nextPageToken, allItems);
                }
                return allItems;
            });

        }
    }
}(angular));
