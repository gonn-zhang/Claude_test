@echo off
chcp 65001 > nul
echo YouTube チャンネル動画リスト取得ツールを起動しています...
echo.
echo ブラウザが自動で開きます。開かない場合は http://localhost:8501 にアクセスしてください。
echo 終了するには、このウィンドウを閉じてください。
echo.
cd /d "%~dp0"
streamlit run youtube_channel_analyzer.py
pause
