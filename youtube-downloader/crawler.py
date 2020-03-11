from typing import Optional, List

from pytube import YouTube, Stream

from google_apis import YoutubeClient


def show_progress_bar(stream: Stream, chunk: bytes, bytes_remaining: int):
    print("视频: {title}, 剩余{remain}MB".format(remain=round(bytes_remaining / (1024 * 1024), 2), title=stream.title))


def download_complete(stream: Stream, file_path: Optional[str]):
    print("{title}下载已经完成".format(title=stream.title))


def build_video_url(vid: str) -> str:
    """
    根据video_id构建url
    :param vid: video_id
    :return: 可以供下载的watch url
    """
    return "https://www.youtube.com/watch?v=" + vid


def handle_per_video(search_results: List[str]):
    """
    按照最高画质进行下载
    :param search_results: 搜索得出的视频url集合
    """
    for vid in search_results:
        print("正在处理视频: " + vid + 20 * ">")
        yt = YouTube(build_video_url(vid),
                     on_progress_callback=show_progress_bar,
                     on_complete_callback=download_complete
                     )
        print("开始下载视频: {title}, 时长: {length}, 播放量: {views}".format(
            title=yt.title,
            length=str(yt.length),
            # desc=yt.description,
            views=str(yt.views)
        ))
        yt.streams.filter(progressive=True, file_extension='mp4').get_highest_resolution().download(skip_existing=True)
        print("处理视频: " + vid + "完成!" + 20 * "<")


# 关键词
KEYWORD = "习近平"

if __name__ == '__main__':
    client = YoutubeClient()
    handle_per_video(client.search(KEYWORD))
