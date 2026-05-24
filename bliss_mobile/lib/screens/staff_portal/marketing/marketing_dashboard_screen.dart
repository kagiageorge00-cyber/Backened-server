import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class MarketingDashboardScreen extends StatelessWidget {
  const MarketingDashboardScreen({super.key});

  // Firestore collection refs (adjust collection names if yours differ)
  CollectionReference get videosRef =>
      FirebaseFirestore.instance.collection('ai_videos');
  CollectionReference get imagesRef =>
      FirebaseFirestore.instance.collection('ai_images');
  CollectionReference get socialRef =>
      FirebaseFirestore.instance.collection('social_posts');
  CollectionReference get whatsappRef =>
      FirebaseFirestore.instance.collection('whatsapp_logs');
  CollectionReference get campaignsRef =>
      FirebaseFirestore.instance.collection('marketing_campaigns');

  Widget kpiCard({
    required IconData icon,
    required String title,
    required int count,
    required Color color,
    double? progress, // 0.0 - 1.0 (optional)
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 14.0),
        child: Row(
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: color.withOpacity(0.15),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    count.toString(),
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(title, style: const TextStyle(color: Colors.black54)),
                  if (progress != null) ...[
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: progress),
                  ]
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget sectionHeader(String title, {String? subtitle}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Row(
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const Spacer(),
          if (subtitle != null) Text(subtitle, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget recentListFromSnapshot(QuerySnapshot snapshot, String displayField) {
    final docs = snapshot.docs;
    if (docs.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(12),
        child: Text('No recent items', style: TextStyle(color: Colors.grey)),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: docs.length > 6 ? 6 : docs.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final data = docs[index].data() as Map<String, dynamic>;
        final ts = (data['timestamp'] as Timestamp?)?.toDate();
        return ListTile(
          dense: true,
          leading: const Icon(Icons.arrow_right, size: 20),
          title: Text(data[displayField]?.toString() ?? '—'),
          subtitle: ts != null ? Text('${ts.toLocal()}') : null,
          trailing: Text('#${docs[index].id.substring(0, 5)}'),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Helper streams
    final videosStream = videosRef.orderBy('timestamp', descending: true).snapshots();
    final imagesStream = imagesRef.orderBy('timestamp', descending: true).snapshots();
    final socialStream = socialRef.orderBy('timestamp', descending: true).snapshots();
    final whatsappStream = whatsappRef.orderBy('timestamp', descending: true).snapshots();
    final campaignsStream = campaignsRef.orderBy('timestamp', descending: true).snapshots();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketing Dashboard'),
        backgroundColor: Colors.deepPurple,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            // KPI Row (uses streams to get counts)
            StreamBuilder<QuerySnapshot>(
              stream: videosStream,
              builder: (context, snapVideos) {
                final videoCount = snapVideos.hasData ? snapVideos.data!.docs.length : 0;
                return StreamBuilder<QuerySnapshot>(
                  stream: imagesStream,
                  builder: (context, snapImages) {
                    final imageCount = snapImages.hasData ? snapImages.data!.docs.length : 0;
                    return StreamBuilder<QuerySnapshot>(
                      stream: socialStream,
                      builder: (context, snapSocial) {
                        final socialCount = snapSocial.hasData ? snapSocial.data!.docs.length : 0;
                        return StreamBuilder<QuerySnapshot>(
                          stream: whatsappStream,
                          builder: (context, snapWhatsapp) {
                            final whatsappCount = snapWhatsapp.hasData ? snapWhatsapp.data!.docs.length : 0;
                            return StreamBuilder<QuerySnapshot>(
                              stream: campaignsStream,
                              builder: (context, snapCampaigns) {
                                final campaignCount = snapCampaigns.hasData ? snapCampaigns.data!.docs.length : 0;

                                // Simple progress example: videos vs images ratio
                                final totalMedia = (videoCount + imageCount);
                                final videoProgress = totalMedia == 0 ? 0.0 : (videoCount / totalMedia);

                                return Column(
                                  children: [
                                    // Grid of 4 KPIs
                                    GridView.count(
                                      shrinkWrap: true,
                                      physics: const NeverScrollableScrollPhysics(),
                                      crossAxisCount: 2,
                                      crossAxisSpacing: 12,
                                      mainAxisSpacing: 12,
                                      childAspectRatio: 2.6,
                                      children: [
                                        kpiCard(
                                          icon: Icons.video_library,
                                          title: 'AI Videos',
                                          count: videoCount,
                                          color: Colors.indigo,
                                          progress: videoProgress,
                                        ),
                                        kpiCard(
                                          icon: Icons.image,
                                          title: 'AI Images',
                                          count: imageCount,
                                          color: Colors.teal,
                                          progress: 1 - videoProgress,
                                        ),
                                        kpiCard(
                                          icon: Icons.share,
                                          title: 'Social Posts',
                                          count: socialCount,
                                          color: Colors.orange,
                                        ),
                                        kpiCard(
                                          icon: Icons.chat_bubble,

                                          title: 'WhatsApp Logs',
                                          count: whatsappCount,
                                          color: Colors.green,
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 12),

                                    // Campaigns + quick totals row
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Card(
                                            child: Padding(
                                              padding: const EdgeInsets.all(12.0),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text('Active Campaigns', style: TextStyle(fontWeight: FontWeight.bold)),
                                                  const SizedBox(height: 8),
                                                  Text('$campaignCount active', style: const TextStyle(color: Colors.grey)),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Card(
                                            child: Padding(
                                              padding: const EdgeInsets.all(12.0),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: const [
                                                  Text('Engagement', style: TextStyle(fontWeight: FontWeight.bold)),
                                                  SizedBox(height: 8),
                                                  Text('Realtime metrics coming soon', style: TextStyle(color: Colors.grey)),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 16),

                                    // Recent Activities (3-column style using small sections)
                                    sectionHeader('Recent Activity'),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Recent Videos
                                        Expanded(
                                          child: Card(
                                            child: Padding(
                                              padding: const EdgeInsets.all(8.0),
                                              child: Column(
                                                children: [
                                                  const Align(
                                                    alignment: Alignment.centerLeft,
                                                    child: Text('Recent Videos', style: TextStyle(fontWeight: FontWeight.bold)),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  if (!snapVideos.hasData)
                                                    const Padding(
                                                      padding: EdgeInsets.all(12),
                                                      child: Center(child: CircularProgressIndicator()),
                                                    )
                                                  else
                                                    recentListFromSnapshot(snapVideos.data!, 'title'),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),

                                        // Recent Images
                                        Expanded(
                                          child: Card(
                                            child: Padding(
                                              padding: const EdgeInsets.all(8.0),
                                              child: Column(
                                                children: [
                                                  const Align(
                                                    alignment: Alignment.centerLeft,
                                                    child: Text('Recent Images', style: TextStyle(fontWeight: FontWeight.bold)),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  if (!snapImages.hasData)
                                                    const Padding(
                                                      padding: EdgeInsets.all(12),
                                                      child: Center(child: CircularProgressIndicator()),
                                                    )
                                                  else
                                                    recentListFromSnapshot(snapImages.data!, 'prompt'),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),

                                        // Recent Social Posts
                                        Expanded(
                                          child: Card(
                                            child: Padding(
                                              padding: const EdgeInsets.all(8.0),
                                              child: Column(
                                                children: [
                                                  const Align(
                                                    alignment: Alignment.centerLeft,
                                                    child: Text('Recent Social Posts', style: TextStyle(fontWeight: FontWeight.bold)),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  if (!snapSocial.hasData)
                                                    const Padding(
                                                      padding: EdgeInsets.all(12),
                                                      child: Center(child: CircularProgressIndicator()),
                                                    )
                                                  else
                                                    recentListFromSnapshot(snapSocial.data!, 'content'),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 16),

                                    // WhatsApp logs & Campaigns sections (full width)
                                    sectionHeader('WhatsApp Activity'),
                                    if (!snapWhatsapp.hasData)
                                      const Center(child: CircularProgressIndicator())
                                    else
                                      Card(
                                        child: Padding(
                                          padding: const EdgeInsets.all(8.0),
                                          child: Column(
                                            children: [
                                              recentListFromSnapshot(snapWhatsapp.data!, 'message'),
                                            ],
                                          ),
                                        ),
                                      ),

                                    const SizedBox(height: 12),

                                    sectionHeader('Campaigns'),
                                    if (!snapCampaigns.hasData)
                                      const Center(child: CircularProgressIndicator())
                                    else
                                      Card(
                                        child: Padding(
                                          padding: const EdgeInsets.all(8.0),
                                          child: recentListFromSnapshot(snapCampaigns.data!, 'name'),
                                        ),
                                      ),

                                    const SizedBox(height: 20),
                                  ],
                                );
                              },
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
