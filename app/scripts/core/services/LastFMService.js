/**
 * Created by aditya on 6/20/16.
 */
(function(){
    'use strict';

    angular.module('soundcloudify.core')
        .service('LastFMService', LastFMService);

    function LastFMService(){


        return {
            init : init
        };

        function init(){
            timeout_func();
        }



    }

    function timeout_func(){
        console.log("YO");
        setInterval(function(){ timeout_funct() }, 1000);
    }
}());
