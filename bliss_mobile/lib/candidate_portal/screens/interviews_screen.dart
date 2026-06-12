import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/api_client.dart';
import '../services/candidate_service.dart';

// Agora app ID for video/voice interview calling
const agoraAppId = '4584c0469d5a4dfdb321d21e7fbf0684';

class InterviewsScreen extends StatefulWidget {
  final ApiClient api;
  const InterviewsScreen({super.key, required this.api});

  @override
  State<InterviewsScreen> createState() => _InterviewsScreenState();
}

class _InterviewsScreenState extends State<InterviewsScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _interviews;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _interviews = _service.getInterviews();
  }

  Future<void> _refresh() async {
    setState(() {
      _interviews = _service.getInterviews();
    });
    await _interviews;
  }

  Future<void> _onAction(String id, bool accept) async {
    final success = accept
        ? await _service.acceptInterview(id)
        : await _service.declineInterview(id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(success ? 'Interview updated' : 'Action failed')),
    );
    await _refresh();
  }

  Future<void> _joinCall(Map<String, dynamic> interview) async {
    final interviewType =
        interview['interviewType']?.toString().toLowerCase() ?? 'video';
    if (!mounted) return;

    // Request permissions
    if (interviewType == 'video') {
      await [Permission.camera, Permission.microphone].request();
    } else {
      await Permission.microphone.request();
    }

    final channelName =
        interview['channelName']?.toString() ?? 'interview_${interview['_id']}';
    final token = interview['agoraToken']?.toString();

    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoCallScreen(
          channelName: channelName,
          token: token,
          isVideoCall: interviewType == 'video',
          interviewId: interview['_id']?.toString() ?? '',
        ),
      ),
    );
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _interviews,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return const Center(child: Text('No interviews scheduled.'));
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              final status = item['interviewStatus']?.toString() ?? 'Pending';
              final hasVideoCall =
                  item['interviewType']?.toString().toLowerCase() == 'video' ||
                      item['interviewType']?.toString().toLowerCase() ==
                          'voice';
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['jobTitle']?.toString() ?? 'Interview',
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(item['companyName']?.toString() ?? 'Employer'),
                      const SizedBox(height: 6),
                      Text(
                          'Date: ${item['interviewDate']?.toString() ?? 'TBD'}'),
                      const SizedBox(height: 6),
                      if (hasVideoCall)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Chip(
                            label: Text(
                                item['interviewType']?.toString() ?? 'Video'),
                            avatar: Icon(
                              item['interviewType']?.toString().toLowerCase() ==
                                      'voice'
                                  ? Icons.call
                                  : Icons.videocam,
                            ),
                          ),
                        ),
                      Row(
                        children: [
                          Chip(label: Text(status)),
                          const Spacer(),
                          if (hasVideoCall &&
                              status.toLowerCase() == 'accepted')
                            ElevatedButton.icon(
                              icon: Icon(
                                item['interviewType']
                                            ?.toString()
                                            .toLowerCase() ==
                                        'voice'
                                    ? Icons.call
                                    : Icons.videocam,
                              ),
                              label: const Text('Join'),
                              onPressed: () => _joinCall(item),
                            )
                          else if (status.toLowerCase() == 'pending') ...[
                            TextButton(
                                onPressed: () => _onAction(
                                    item['_id']?.toString() ?? '', false),
                                child: const Text('Decline')),
                            ElevatedButton(
                                onPressed: () => _onAction(
                                    item['_id']?.toString() ?? '', true),
                                child: const Text('Accept')),
                          ]
                        ],
                      )
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class VideoCallScreen extends StatefulWidget {
  final String channelName;
  final String? token;
  final bool isVideoCall;
  final String interviewId;

  const VideoCallScreen({
    super.key,
    required this.channelName,
    this.token,
    required this.isVideoCall,
    required this.interviewId,
  });

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> {
  late RtcEngine agoraEngine;
  int? remoteUid;
  bool localUserJoined = false;
  bool isMuted = false;
  bool isVideoOff = false;

  @override
  void initState() {
    super.initState();
    initAgora();
  }

  Future<void> initAgora() async {
    try {
      agoraEngine = createAgoraRtcEngine();
      await agoraEngine.initialize(RtcEngineContext(appId: agoraAppId));

      agoraEngine.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (connection, elapsed) {
            if (mounted) {
              setState(() => localUserJoined = true);
              ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Joined interview')));
            }
          },
          onUserJoined: (connection, remoteUid, elapsed) {
            if (mounted) setState(() => this.remoteUid = remoteUid);
          },
          onUserOffline: (connection, remoteUid, reason) {
            if (mounted) setState(() => this.remoteUid = null);
          },
          onError: (err, msg) {
            if (mounted) {
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text('Error: $msg')));
            }
          },
        ),
      );

      if (widget.isVideoCall) {
        await agoraEngine.enableVideo();
        await agoraEngine.startPreview();
      } else {
        await agoraEngine.enableAudio();
      }

      await agoraEngine.joinChannel(
        token: widget.token ?? '',
        channelId: widget.channelName,
        uid: 0,
        options: const ChannelMediaOptions(
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Agora error: $e')));
      }
    }
  }

  @override
  void dispose() {
    agoraEngine.leaveChannel();
    agoraEngine.release();
    super.dispose();
  }

  void toggleMute() {
    setState(() => isMuted = !isMuted);
    agoraEngine.muteLocalAudioStream(isMuted);
  }

  void toggleVideo() {
    if (widget.isVideoCall) {
      setState(() => isVideoOff = !isVideoOff);
      agoraEngine.muteLocalVideoStream(isVideoOff);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: widget.isVideoCall
            ? const Text('Video Interview')
            : const Text('Voice Interview'),
        automaticallyImplyLeading: true,
      ),
      body: Stack(
        children: [
          Center(
            child: widget.isVideoCall
                ? (remoteUid == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Waiting for interviewer...'),
                        ],
                      )
                    : Container(
                        color: Colors.black,
                        child: const Center(
                            child: Text('Remote video',
                                style: TextStyle(color: Colors.white))),
                      ))
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.call, size: 80, color: Colors.blue[300]),
                      const SizedBox(height: 16),
                      const Text('Voice Interview Active',
                          style: TextStyle(fontSize: 18)),
                      const SizedBox(height: 8),
                      Text('Channel: ${widget.channelName}',
                          style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
          ),
          if (widget.isVideoCall && localUserJoined)
            Positioned(
              bottom: 80,
              right: 16,
              child: Container(
                width: 100,
                height: 150,
                color: Colors.black45,
                child: const Center(
                    child: Text('You',
                        style: TextStyle(color: Colors.white, fontSize: 12))),
              ),
            ),
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FloatingActionButton(
                    onPressed: toggleMute,
                    backgroundColor: isMuted ? Colors.red : Colors.grey[700],
                    child: Icon(isMuted ? Icons.mic_off : Icons.mic),
                  ),
                  const SizedBox(width: 16),
                  if (widget.isVideoCall)
                    FloatingActionButton(
                      onPressed: toggleVideo,
                      backgroundColor:
                          isVideoOff ? Colors.red : Colors.grey[700],
                      child: Icon(
                          isVideoOff ? Icons.videocam_off : Icons.videocam),
                    ),
                  const SizedBox(width: 16),
                  FloatingActionButton(
                    onPressed: () => Navigator.pop(context),
                    backgroundColor: Colors.red,
                    child: const Icon(Icons.call_end),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
