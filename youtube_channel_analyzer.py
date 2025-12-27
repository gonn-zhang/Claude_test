"""
YouTube チャンネル動画リスト取得アプリ
========================================
チャンネルIDを入力するだけで、そのチャンネルの全動画情報を
CSVファイルとしてダウンロードできるWebアプリケーションです。

使い方:
    streamlit run youtube_channel_analyzer.py
"""

import streamlit as st
import pandas as pd
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import io
import re
from datetime import datetime

# ページ設定
st.set_page_config(
    page_title="YouTube チャンネル動画リスト取得ツール",
    page_icon="🎬",
    layout="centered"
)

# タイトルと説明
st.title("🎬 YouTube チャンネル動画リスト取得ツール")
st.markdown("""
YouTubeチャンネルの全動画情報を取得し、CSVファイルとしてダウンロードできます。

**取得できる情報:**
- 動画タイトル
- 動画URL
- 動画種別（通常動画 / ライブ配信 / ショート）
- 動画の長さ
- 再生回数
- 高評価数
- コメント数
- 投稿日時
""")

st.divider()

# サイドバーでAPI設定
with st.sidebar:
    st.header("⚙️ API設定")
    api_key = st.text_input(
        "YouTube API キー",
        type="password",
        help="Google Cloud ConsoleでYouTube Data API v3のAPIキーを取得してください"
    )

    st.markdown("---")
    st.markdown("""
    ### 📖 APIキーの取得方法
    1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
    2. 新しいプロジェクトを作成
    3. 「APIとサービス」→「ライブラリ」
    4. 「YouTube Data API v3」を検索して有効化
    5. 「認証情報」→「認証情報を作成」→「APIキー」
    """)

    st.markdown("---")
    st.markdown("""
    ### 📝 チャンネルIDの見つけ方
    1. YouTubeチャンネルページを開く
    2. URLを確認: `youtube.com/channel/UC...`
    3. `UC`から始まる部分がチャンネルID

    または、チャンネルページで右クリック→「ページのソースを表示」→「channelId」で検索
    """)


def get_channel_info(youtube, channel_id):
    """チャンネル情報とプレイリストIDを取得"""
    try:
        channel = youtube.channels().list(
            part='snippet,contentDetails,statistics',
            id=channel_id
        ).execute()

        if not channel.get('items'):
            return None, None, None

        item = channel['items'][0]
        channel_name = item['snippet']['title']
        playlist_id = item['contentDetails']['relatedPlaylists']['uploads']
        video_count = int(item['statistics'].get('videoCount', 0))

        return channel_name, playlist_id, video_count
    except HttpError as e:
        st.error(f"チャンネル情報の取得に失敗しました: {e}")
        return None, None, None


def get_video_ids(youtube, playlist_id, progress_bar, status_text):
    """プレイリストから全動画IDを取得"""
    video_ids = []
    next_page_token = None
    page_count = 0

    while True:
        playlist_items = youtube.playlistItems().list(
            part='contentDetails',
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        ).execute()

        video_ids.extend(
            item['contentDetails']['videoId']
            for item in playlist_items['items']
        )

        page_count += 1
        status_text.text(f"動画ID取得中... {len(video_ids)}件")

        next_page_token = playlist_items.get('nextPageToken')
        if not next_page_token:
            break

    return video_ids


def get_videos_info(youtube, video_ids, progress_bar, status_text):
    """動画の詳細情報を取得（50件ずつバッチ処理）"""
    videos = []
    total = len(video_ids)

    # 50件ずつバッチ処理（API効率化）
    for i in range(0, total, 50):
        batch_ids = video_ids[i:i+50]
        video_info = youtube.videos().list(
            part='snippet,statistics,contentDetails,liveStreamingDetails',
            id=','.join(batch_ids)
        ).execute()

        videos.extend(video_info['items'])

        progress = min((i + 50) / total, 1.0)
        progress_bar.progress(progress)
        status_text.text(f"動画情報取得中... {min(i+50, total)}/{total}件")

    return videos


def parse_duration(duration_str):
    """ISO 8601形式の動画時間をパースして秒数と表示用文字列を返す"""
    if not duration_str:
        return 0, "不明"

    # ISO 8601形式: PT1H2M3S = 1時間2分3秒
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration_str)

    if not match:
        return 0, "不明"

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    total_seconds = hours * 3600 + minutes * 60 + seconds

    # 表示用フォーマット
    if hours > 0:
        display = f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        display = f"{minutes}:{seconds:02d}"

    return total_seconds, display


def detect_video_type(video):
    """動画種別を判定（通常動画 / ライブ配信 / ショート）"""
    # ライブ配信の判定
    # liveStreamingDetailsが存在する = ライブ配信（過去含む）
    if 'liveStreamingDetails' in video:
        return "ライブ配信"

    # liveBroadcastContentが"live"または"upcoming"
    live_status = video['snippet'].get('liveBroadcastContent', 'none')
    if live_status in ['live', 'upcoming']:
        return "ライブ配信"

    # ショート動画の判定
    # 動画時間が60秒以下
    duration_str = video.get('contentDetails', {}).get('duration', '')
    total_seconds, _ = parse_duration(duration_str)

    if 0 < total_seconds <= 60:
        return "ショート"

    return "通常動画"


def format_videos_to_dataframe(videos):
    """動画情報をDataFrameに変換"""
    data = []

    for video in videos:
        # 投稿日時をフォーマット
        published_at = video['snippet']['publishedAt']
        try:
            dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            formatted_date = dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            formatted_date = published_at

        # 動画種別を判定
        video_type = detect_video_type(video)

        # 動画の長さを取得
        duration_str = video.get('contentDetails', {}).get('duration', '')
        _, duration_display = parse_duration(duration_str)

        data.append({
            'タイトル': video['snippet']['title'],
            '動画URL': f"https://youtube.com/watch?v={video['id']}",
            '種別': video_type,
            '動画時間': duration_display,
            '再生回数': int(video['statistics'].get('viewCount', 0)),
            '高評価数': int(video['statistics'].get('likeCount', 0)),
            'コメント数': int(video['statistics'].get('commentCount', 0)),
            '投稿日時': formatted_date
        })

    return pd.DataFrame(data)


# メイン入力フォーム
st.subheader("📺 チャンネル情報を入力")

col1, col2 = st.columns([2, 1])

with col1:
    channel_id = st.text_input(
        "チャンネルID",
        placeholder="例: UCwN1ct-Akdd3xzll2wNrNbw",
        help="YouTubeチャンネルのID（UCから始まる文字列）"
    )

with col2:
    custom_name = st.text_input(
        "ファイル名（任意）",
        placeholder="チャンネル名",
        help="CSVファイル名に使用します（空欄の場合は自動取得）"
    )

# 実行ボタン
if st.button("🚀 動画リストを取得", type="primary", use_container_width=True):

    # バリデーション
    if not api_key:
        st.error("⚠️ サイドバーでAPIキーを入力してください")
        st.stop()

    if not channel_id:
        st.error("⚠️ チャンネルIDを入力してください")
        st.stop()

    if not channel_id.startswith('UC'):
        st.warning("⚠️ チャンネルIDは通常「UC」から始まります。入力を確認してください。")

    try:
        # YouTube API クライアント作成
        youtube = build('youtube', 'v3', developerKey=api_key)

        # プログレス表示
        progress_bar = st.progress(0)
        status_text = st.empty()

        # Step 1: チャンネル情報取得
        status_text.text("チャンネル情報を取得中...")
        channel_name, playlist_id, video_count = get_channel_info(youtube, channel_id)

        if not playlist_id:
            st.error("❌ チャンネルが見つかりません。チャンネルIDを確認してください。")
            st.stop()

        st.success(f"✅ チャンネル「{channel_name}」を検出（約{video_count}件の動画）")
        progress_bar.progress(0.1)

        # Step 2: 動画ID取得
        status_text.text("動画IDを取得中...")
        video_ids = get_video_ids(youtube, playlist_id, progress_bar, status_text)
        progress_bar.progress(0.3)

        if not video_ids:
            st.warning("⚠️ このチャンネルには動画がありません。")
            st.stop()

        # Step 3: 動画詳細取得
        videos = get_videos_info(youtube, video_ids, progress_bar, status_text)
        progress_bar.progress(1.0)
        status_text.text("完了！")

        # DataFrameに変換
        df = format_videos_to_dataframe(videos)

        # 結果表示
        st.divider()
        st.subheader(f"📊 取得結果: {len(df)}件の動画")

        # 種別ごとの件数
        type_counts = df['種別'].value_counts()
        normal_count = type_counts.get('通常動画', 0)
        live_count = type_counts.get('ライブ配信', 0)
        short_count = type_counts.get('ショート', 0)

        st.markdown(f"**種別内訳:** 📹 通常動画 {normal_count}件 ／ 🔴 ライブ配信 {live_count}件 ／ ⚡ ショート {short_count}件")

        # 統計情報
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("総再生回数", f"{df['再生回数'].sum():,}")
        with col2:
            st.metric("総高評価数", f"{df['高評価数'].sum():,}")
        with col3:
            st.metric("平均再生回数", f"{int(df['再生回数'].mean()):,}")

        # データプレビュー
        st.dataframe(
            df,
            use_container_width=True,
            height=400,
            column_config={
                "動画URL": st.column_config.LinkColumn("動画URL"),
                "種別": st.column_config.TextColumn("種別", width="small"),
                "動画時間": st.column_config.TextColumn("動画時間", width="small"),
                "再生回数": st.column_config.NumberColumn("再生回数", format="%d"),
                "高評価数": st.column_config.NumberColumn("高評価数", format="%d"),
                "コメント数": st.column_config.NumberColumn("コメント数", format="%d"),
            }
        )

        # CSVダウンロードボタン
        file_name = custom_name if custom_name else channel_name
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')

        st.download_button(
            label="📥 CSVファイルをダウンロード",
            data=csv_buffer.getvalue(),
            file_name=f"{file_name}-動画リスト.csv",
            mime="text/csv",
            use_container_width=True
        )

    except HttpError as e:
        if e.resp.status == 403:
            st.error("❌ APIキーが無効か、クォータ制限に達しました。APIキーを確認してください。")
        elif e.resp.status == 400:
            st.error("❌ リクエストが無効です。チャンネルIDを確認してください。")
        else:
            st.error(f"❌ APIエラー: {e}")
    except Exception as e:
        st.error(f"❌ エラーが発生しました: {e}")

# フッター
st.divider()
st.markdown("""
<div style="text-align: center; color: gray; font-size: 0.8em;">
    YouTube Data API v3 を使用しています<br>
    APIの利用規約に従ってご利用ください
</div>
""", unsafe_allow_html=True)
