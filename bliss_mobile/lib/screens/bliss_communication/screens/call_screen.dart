import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';

class CallScreen extends StatefulWidget {
  final String channelId;
  final bool isVideo;

  const CallScreen({super.key, required this.channelId, required this.isVideo});

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  int? remoteUid;
  final String appId = "YOUR_AGORA_APP_ID";
  final String token = ""; // Use temp token or real token
  late RtcEngine _engine;

  @override
  void initState() {
    super.initState();
    initAgora();
  }

  Future<void> initAgora() async {
    _engine = createAgoraRtcEngine();
    await _engine.initialize(RtcEngineContext(appId: appId));

    if (widget.isVideo) {
      await _engine.enableVideo();
    } else {
      await _engine.disableVideo();
    }
    await _engine.enableAudio();

    _engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (connection, elapsed) {
          debugPrint("Local user joined channel ${connection.channelId}");
        },
        onUserJoined: (connection, remoteUid, elapsed) {
          setState(() {
            this.remoteUid = remoteUid;
          });
        },
        onUserOffline: (connection, remoteUid, reason) {
          setState(() {
            this.remoteUid = null;
          });
        },
      ),
    );

    await _engine.joinChannel(
      token: token,
      channelId: widget.channelId,
      uid: 0,
      options: const ChannelMediaOptions(),
    );
  }

  @override
  void dispose() {
    _engine.leaveChannel();
    _engine.release();
    super.dispose();
  }

  Widget _remoteVideo() {
    if (!widget.isVideo) return const SizedBox.shrink();
    if (remoteUid != null) {
      return AgoraVideoView(
        controller: VideoViewController.remote(
          rtcEngine: _engine,
          canvas: VideoCanvas(uid: remoteUid),
          connection: RtcConnection(channelId: widget.channelId),
        ),
      );
    } else {
      return const Center(child: Text("Waiting for user..."));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(widget.isVideo ? "Video Call" : "Voice Call"),
        backgroundColor: Colors.black,
      ),
      body: Stack(
        children: [
          if (widget.isVideo) _remoteVideo(),
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    shape: const CircleBorder(),
                    padding: const EdgeInsets.all(16),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Icon(Icons.call_end, color: Colors.white),
                ),
                if (widget.isVideo)
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[700],
                      shape: const CircleBorder(),
                      padding: const EdgeInsets.all(16),
                    ),
                    onPressed: () {
                      _engine.switchCamera();
                    },
                    child: const Icon(Icons.cameraswitch, color: Colors.white),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
