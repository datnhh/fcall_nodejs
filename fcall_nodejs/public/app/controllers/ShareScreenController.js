app.controller("ShareScreenController", function ($window, $scope, $location, $http, $cookies) {
    log('share controllor');
    /* var */
    var connection = new RTCMultiConnection();
    $scope.userID = '';
    $scope.IsInRoom = false;
    $scope.IsRejoin = false;
    $scope.IsDisconnect = false;
    $scope.IsMute = false;
    $scope.IsOffVideo = false;
    $scope.ListUser = [];

    //connection.socketURL = 'https://127.0.0.1:443/';
    connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    connection.socketMessageEvent = 'cross-domain-screen-capture-demo';
    //connection.getExternalIceServers = true;

    connection.session = {
        screen: true,
        oneway: true,
        //video: false,
        //audio: false,
        //broadcast: true
    };

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: true
    };

    connection.connectSocket();
    $scope.userID = connection.userid;
    $scope.roomID = '';
    $scope.roomID = $location.search().room;
    console.log($scope.roomID);
    updateDevice();

    if ($scope.roomID == '' || typeof $scope.roomID === "undefined") {
        log('Wait open room');
        //open room and wait
        if (localStorage.getItem(connection.socketMessageEvent)) {
            $scope.roomID = localStorage.getItem(connection.socketMessageEvent);
        } else {
            //$scope.roomID = connection.token();
            $scope.roomID = '123';
        }
    }
    else {
        //join or open room        
        connection.checkPresence($scope.roomID, function (isRoomExists, roomid) {
            if (isRoomExists) {
                log('Join to exists room!');
                alertify.success('Join to exists room!');

                VideoAudio_Screen(false);

                if ($scope.IsRejoin) {
                    connection.rejoin(connection.connectionDescription);
                    $scope.IsRejoin = true;
                    $scope.IsInRoom = true;
                }
                else {
                    connection.connectionDescription = connection.join(roomid);

                    $scope.IsInRoom = true;
                    $scope.IsRejoin = false;
                }
                $scope.userID = connection.userid;
                updateUserList();
            }
            else {
                log('Wait created room!');
                alertify.warning('There are not room with name ' + $scope.roomID + '. Click Open/Join to create room before.');
                //connection.open(roomid);
                //$scope.userID = connection.userid;

                //$scope.IsInRoom = true;
                //$scope.IsRejoin = false;
            }
        });
        //connection.connectionDescription = connection.join($scope.roomID);        
    }

    connection.videosContainer = $('.right-content');

    connection.onstream = function (event) {
        log('onstream');
        connection.videosContainer.append(addStream(event));

        updateUserList();
    };

    connection.onconnected = function (event) {
        log('onconnected');
        log('Peer connection has been established between you and', event.userid);

        // event.peer.addStream || event.peer.removeStream || event.peer.changeBandwidth
        // event.peer == connection.peers[event.userid]

        event.peer.getConnectionStats(function (result) {
            // many useful statistics here
        });
    };

    connection.onstreamended = function (event) {
        log("onstreamended");
        console.log(connection.isInitiator);
        updateUserList();
        var mediaElement = $("#" + event.streamid);
        if (mediaElement) {
            mediaElement.remove();
            $('#stream_' + event.streamid).remove();
            //$('.right-content .item-video').remove();
        }

        console.log(event.userid == $scope.userID);
        if (event.userid == $scope.userID) {
            //neu ko phai la admin
            if (!connection.isInitiator) {
                $('.item-video').remove();
            }
            $scope.IsInRoom = false;
            $scope.IsRejoin = false;
        }
    };

    connection.onNewSession = function (session) {
        log("onNewSession");
        // session.userid
        // session.sessionid
        // session.extra
        // session.session i.e. {audio,video,screen,data}
        session.join();
        log("session.userid join: " + session.userid);

    };

    connection.ondisconnected = function (event) {
        log("ondisconnected");
        if (event.isSocketsDisconnected == true) {
            alertify.error("Disconect from admin");
        }
    };

    connection.onSessionClosed = function (e) {
        log("onSessionClosed");
        console.log(e);
        // entire session is closed
        //if (!connection.isInitiator) {
        //    $scope.IsInRoom = false;
        //    $scope.IsRejoin = false;
        //}
        // e.userid
        // e.extra
        // e.isSessionClosed

        // e.session == connection.sessionDescription
        // e.session.sessionid
        // e.session.userid --- initiator id
        // e.session.session -- {audio:true, video:true}
    };

    connection.onleave = function (e) {
        // e.entireSessionClosed --------- this property can be tested in v1.7 or later
        // e.userid
        // e.extra
        log('onleave');
        console.log(e);
        console.log(e.extra);
        updateUserList();
        //$scope.IsInRoom = false;
        //$scope.IsRejoin = false;
        //connection.disconnect();
        //connection.close();
        //var localstream = getLocalStream();
        //if (localstream != null) {
        //    $('#stream_' + localstream.streamid).remove();
        //}
        //alertify.error("Disconect from admin");
        //connection.leave();
    }

    connection.onclose = function (e) {
        log('onclose');
        console.log(e);
        // e.userid
        // e.extra
    }

    connection.DetectRTC.load(function () {
        if (!connection.DetectRTC.hasMicrophone) {
            alertify.error("You dont have Microphone!");
            console.log("hasMicrophone");
        }

        if (!connection.DetectRTC.hasSpeakers) {
            alertify.error("You dont have Speakers!");
            console.log("hasSpeakers");
        }

        if (!connection.DetectRTC.hasWebcam) {
            alertify.error("You dont have Webcam!");
            console.log("hasWebcam");
        }
        if (!connection.DetectRTC.isScreenCapturingSupported) {
            alertify.minimalDialog || alertify.dialog('minimalDialog', function () {
                return {
                    main: function (content) {
                        this.setContent(content);
                    },
                    setup: function () {
                        return {
                            options: {
                                title: 'Please install extension to share screen!'
                            }
                        };
                    }
                };
            });
            alertify.minimalDialog('(Install <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Chrome</a> / or / <a href="https://www.webrtc-experiment.com/store/firefox-extension/enable-screen-capturing.xpi" target="_blank">Firefox</a> extension) - Extensions are <a href="https://github.com/muaz-khan?tab=repositories">open-sourced</a>!');

        }
    });
        
    connection.getScreenConstraints = function (callback, audioPlusTab) {
        if (isAudioPlusTab(connection, audioPlusTab)) {
            audioPlusTab = true;
        }

        getScreenConstraints(function (error, screen_constraints) {
            console.log("error ", error);
            if (!error) {
                console.log(' -o- ');
                screen_constraints = connection.modifyScreenConstraints(screen_constraints);
                callback(error, screen_constraints);
                return;
            }
            else {
                switch (error) {
                    case 'PermissionDeniedError': alertify.error('Denied by user'); $scope.IsInRoom = false; break;
                    case 'installed-disabled': alertify.error("Screen share was install but disabled!"); $scope.IsInRoom = false; break;
                    case 'not-installed': {
                        $scope.IsInRoom = false;
                        alertify.minimalDialog || alertify.dialog('minimalDialog', function () {
                            return {
                                main: function (content) {
                                    this.setContent(content);
                                },
                                setup: function () {
                                    return {
                                        options: {
                                            title: 'Please install extension to share screen!'
                                        }
                                    };
                                }
                            };
                        });
                        alertify.minimalDialog('(Install <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Chrome</a> / or / <a href="https://www.webrtc-experiment.com/store/firefox-extension/enable-screen-capturing.xpi" target="_blank">Firefox</a> extension) - Extensions are <a href="https://github.com/muaz-khan?tab=repositories">open-sourced</a>!');
                    } break;
                }
            }
            //throw error;
        }, audioPlusTab);
    };



    //$scope.Mute = function (n) {
    //    alertify.warning('Mute ' + n);
    //};

    //$scope.Vol = function (n) {
    //    alertify.warning('Vol ' + n);
    //};

    $scope.OpenOrJoin = function () {
        if (!$scope.IsInRoom) {
            if ($scope.roomID != '') {
                connection.checkPresence($scope.roomID, function (isRoomExists, roomid) {
                    if (isRoomExists) {
                        log('Join to exists room!');
                        alertify.success('Join to exists room!');
                        if ($scope.IsRejoin) {

                            //VideoAudio_Screen(false);

                            //connection.rejoin(connection.connectionDescription);
                            connection.join(roomid);
                            $scope.IsRejoin = true;
                            $scope.IsInRoom = true;
                            $scope.IsDisconnect = false;
                        }
                        else {
                            //VideoAudio_Screen(false);

                            //connection.connectionDescription = connection.join(roomid);
                            connection.join(roomid);

                            $scope.IsInRoom = true;
                            $scope.IsRejoin = false;
                            $scope.IsDisconnect = false;
                        }
                        $scope.userID = connection.userid;
                    }
                    else {
                        log('Created room successful!');
                        alertify.success('Created room successful!');

                        //VideoAudio_Screen(false);

                        connection.open(roomid);
                        $scope.userID = connection.userid;

                        $scope.IsInRoom = true;
                        $scope.IsRejoin = false;
                        $scope.IsDisconnect = false;
                    }
                    updateUserList();
                });


            } else {
                alertify.warning("Enter room ID!");
            }
        }
        else {
            alertify.error("You are in a conversation!");
        }
    };

    $scope.DisconnectRoom = function () {
        if (!connection.isInitiator && !$scope.IsDisconnect) {
            connection.leave();
            alertify.success('Leave connect succesful!');
            $scope.IsInRoom = false;
            $scope.IsRejoin = true;
            $scope.IsDisconnect = true;
            var localstream = getLocalStream();
            //log(localstream);
            if (localstream != null) {
                $('#stream_' + localstream.streamid).remove();
            }
        }
        else {
            log('disconnect: ' + $scope.IsDisconnect);
            if (!$scope.IsDisconnect) {
                connection.closeEntireSession(function () {
                    $scope.IsInRoom = false;
                    $scope.IsRejoin = false;
                    alertify.success('Disconnect succesful!');
                    $scope.IsDisconnect = true;
                    var localstream = getLocalStream();
                    //log(localstream);
                    if (localstream != null) {
                        $('#stream_' + localstream.streamid).remove();
                    }
                });

            }
            else {
                alertify.warning('You dont connect to any room!');
            }
        }

    };

    $scope.Mute = function () {

        //connection.DetectRTC.MediaDevices.forEach(function (device) {
        //    // device.deviceId
        //    // device.kind == 'audioinput' || 'audiooutput' || 'audio'

        //    //connection.selectDevices(device.deviceId);
        //    log(device.deviceId);
        //});
        if ($scope.IsInRoom) {
            //luon luon dung
            if (true || connection.hasMicrophone) {
                if (!$scope.IsMute) {
                    var lc = getLocalStream();
                    if (lc != null) {
                        connection.streamEvents[lc.streamid].stream.mute('audio'); // 'audio' || 'video' || 'both'
                        $scope.IsMute = true;
                    }
                    log("Mute");
                }
                else {
                    var lc = getLocalStream();
                    if (lc != null) {
                        connection.streamEvents[lc.streamid].stream.unmute('audio'); // 'audio' || 'video' || 'both'
                        $scope.IsMute = false;
                    }
                }
            } else {
                alertify.warning("You dont have Microphone!");
            }
        } else {
            alertify.warning('You dont connect to any room!');
        }
    };

    $scope.OffVideo = function () {
        if ($scope.IsInRoom) {
            if (connection.DetectRTC.hasWebcam) {
                if (!$scope.IsOffVideo) {
                    var lc = getLocalStream();
                    if (lc != null) {
                        connection.streamEvents[lc.streamid].stream.mute('video'); // 'audio' || 'video' || 'both'
                        $scope.IsOffVideo = true;
                    }
                    log("OffVideo");
                }
                else {
                    var lc = getLocalStream();
                    if (lc != null) {
                        connection.streamEvents[lc.streamid].stream.unmute('video'); // 'audio' || 'video' || 'both'
                        $scope.IsOffVideo = false;
                    }
                }
            } else {
                alertify.warning("You dont have Webcam!");
            }
        } else {
            alertify.warning('You dont connect to any room!');
        }
    };

    $scope.ShareScreen = function () {
        log($scope.IsInRoom);
        $scope.DisconnectRoom();
        $location.url('/');

        //if (!$scope.IsInRoom) {
        //    if (connection.DetectRTC.isScreenCapturingSupported) {
        //        connection.socketMessageEvent = 'screen-sharing-demo';
        //        //VideoAudio_Screen(true);

        //        connection.checkPresence($scope.roomID, function (isRoomExists, roomid) {
        //            if (isRoomExists) {
        //                log('t isRoomExists');

        //                //VideoAudio_Screen(true);


        //                connection.join($scope.roomID);

        //                $scope.IsInRoom = true;
        //                $scope.IsRejoin = false;
        //                $scope.IsDisconnect = false;
        //            } else {
        //                log('f isRoomExists');

        //                //VideoAudio_Screen(true);

        //                connection.open($scope.roomID);
        //                $scope.IsInRoom = true;
        //                $scope.IsDisconnect = false;
        //                $scope.userID = connection.userid;
        //            }
        //        });
        //        //alertify.warning("Coming soon :D");

        //    } else {
        //        alertify.error('Please install extension to share screen!');
        //    }
        //} else {
        //    alertify.error('Leave room before using this function!');
        //}

    }

    $scope.CopyLink = function () {
        if ($scope.IsInRoom) {
            var link = window.location.protocol + "//" + window.location.host + '/#/?room=' + $scope.roomID;
            alertify.prompt('Link room', "Copy link to share", link,
                function (evt, value) {
                    //alertify.success('Ok: ' + value);
                    var copyTextarea = document.querySelector('.ajs-input');
                    copyTextarea.select();
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';
                    console.log('Copying text command was ' + msg);
                },
                function () {
                    //alertify.error('Cancel');
                });
        } else {
            alertify.warning('You dont connect to any room');
        }
    }

    $scope.SwitchInputOpen = function () {
        alertify.genericDialog || alertify.dialog('genericDialog', function () {
            return {
                main: function (content) {
                    this.setContent(content);
                },
                setup: function () {
                    return {
                        options: {
                            title: 'Switch Audio/Video Input',
                            basic: true,
                            maximizable: false,
                            resizable: false,
                            padding: false,
                            movable: false,
                        }
                    };
                }
            };
        });
        //force focusing password box
        alertify.genericDialog($('#SwitchInput')[0]);
    }

    $scope.SwitchInput = function () {
        if ($scope.IsInRoom) {
            var videoSourceId = $('#VideoDevice').val();
            //log(videoSourceId);
            //log(connection.mediaConstraints.audio.optional[0].sourceId);
            //log(connection.attachStreams);
            if (connection.mediaConstraints.video.optional.length && connection.attachStreams.length) {
                if (connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
                    log('Selected video device is already selected.');
                    //alertify.warning('Selected video device is already selected.');
                    //return;
                }
            }
            else {
                connection.attachStreams.forEach(function (stream) {
                    stream.getVideoTracks().forEach(function (track) {
                        stream.removeTrack(track);
                        if (track.stop) {
                            track.stop();
                        }
                    });
                });

                connection.mediaConstraints.video.optional = [{
                    sourceId: videoSourceId
                }];

                connection.captureUserMedia();
            }

            var audioSourceId = $('#AudioDevice').val();
            //log(audioSourceId);
            //log(connection.mediaConstraints.audio.optional[0].sourceId);
            //log(connection.attachStreams);

            if (connection.mediaConstraints.audio.optional.length && connection.attachStreams.length) {
                if (connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
                    log('Selected audio device is already selected.');
                    //return;
                }
            }
            else {
                connection.attachStreams.forEach(function (stream) {
                    stream.getAudioTracks().forEach(function (track) {
                        stream.removeTrack(track);
                        if (track.stop) {
                            track.stop();
                        }
                    });
                });

                connection.mediaConstraints.audio.optional = [{
                    sourceId: audioSourceId
                }];
                connection.captureUserMedia();
            }

            alertify.success('Switch device successful!');
            alertify.genericDialog().close();
        } else {
            alertify.error('Open or Join room first!');
        }
    }


    function addStream(event) {
        //var str = '<div class="item-video" id="stream_"' + event.streamid +'>';
        //str += '<span class="item-video-name">User ' + event.userid +'</span>';
        //str += '<span class="item-video-expand"><i class="fa fa-expand"></i></span>';
        //str += event.mediaElement;
        //str += '<div class="item-video-control">';
        //str += '<button ng-click="Mute(' + event.streamid +')"><i class="fa fa-microphone"></i></button>';
        //str += '<button ng-click="Vol(' + event.streamid +')"><i class="fa fa-volume-up"></i></button>';
        //str += '</div>';
        //str += '</div>';
        //return str;

        var d = document.createElement('div');
        $(d).addClass("item-video").attr('id', 'stream_' + event.streamid);
        $(d).append('<span class="item-video-name">User ' + event.userid + '</span>');
        $(d).append('<span class="item-video-expand"><i class="fa fa-expand"></i></span>');
        $(d).append(event.mediaElement);
        var str = '<div class="item-video-control">';
        str += '<button ng-click="Mute(' + event.streamid + ')"><i class="fa fa-microphone"></i></button>';
        str += '<button ng-click="Vol(' + event.streamid + ')"><i class="fa fa-volume-up"></i></button>';
        str += '</div>';
        $(d).append(str);
        return d;
    }

    function getLocalStream() {
        if (connection.streamEvents != null) {
            //log(Object.keys(connection.streamEvents).length);
            if (Object.keys(connection.streamEvents).length > 2) {
                var stream = connection.streamEvents[Object.keys(connection.streamEvents)[2]];
                if (stream.type == "local") return stream;
            }
            return null;
        }
        return null;
    }

    function log(arg) {
        var now = (window.performance.now() / 1000).toFixed(3);
        console.log(now + ': ', arg);
    }
    function updateUserList() {
        $scope.ListUser = connection.getAllParticipants();
        $scope.$applyAsync();
    }

    function updateDevice() {
        connection.DetectRTC.MediaDevices.forEach(function (device) {
            if (device.kind === 'audioinput') {
                var option = document.createElement('option');
                //option.id = device.id;
                option.innerHTML = device.label || device.id;
                option.value = device.id;
                $('#AudioDevice').append(option);

                if (typeof connection.mediaConstraints.audio.optional !== 'undefined' && connection.mediaConstraints.audio.optional.length && connection.mediaConstraints.audio.optional[0].sourceId === device.id) {
                    option.selected = true;
                }
            }

            if (device.kind.indexOf('video') !== -1) {
                var option = document.createElement('option');
                //option.id = device.id;
                option.innerHTML = device.label || device.id;
                option.value = device.id;
                $('#VideoDevice').append(option);

                if (typeof connection.mediaConstraints.video.optional !== 'undefined' && connection.mediaConstraints.video.optional.length && connection.mediaConstraints.video.optional[0].sourceId === device.id) {
                    option.selected = true;
                }
            }
        });
    }

    function VideoAudio_Screen(sc) {
        if (sc) {
            //neu dang la screen share
            connection.session = {
                screen: true,
                oneway: true
                //broadcast: true 
            };

            connection.sdpConstraints.mandatory = {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            };
        }
        else {
            //neu video or audio call
            connection.session = {
                audio: true,
                video: true
            };

            connection.sdpConstraints.mandatory = {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            };
        }
    }

});