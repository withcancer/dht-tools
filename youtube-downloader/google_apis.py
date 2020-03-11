from typing import List, Dict, Any
from googleapiclient.discovery import build

GOOGLE_API_KEY = "AIzaSyAPRq8n96o8c3Seac1vEIMVns1kKSyfnN8"
API_SERVICE_NAME = "youtube"
API_VERSION = "v3"


class YoutubeClient(object):
    def __init__(self):
        self.__service = build(serviceName=API_SERVICE_NAME, version=API_VERSION, developerKey=GOOGLE_API_KEY)

    def search(self, keyword: str) -> List[str]:
        """
        在youtube上检索视频，并返回url列表
        目前条件是前50条最热门的视频
        :param keyword: 关键字
        :return: 视频url列表
        """
        request = self.__service.search().list(
            part="snippet",
            maxResults=2,
            type="video",
            q=keyword,  # Your request can also use the Boolean NOT (-) and OR (|)
            # operators to exclude videos or to find videos that are associated
            # with one of several search terms.
            order="viewCount"  # date rating relevance title videoCount
        )
        response = request.execute()
        print("以关键字{key}进行搜索后，得到{length}个结果".format(
            key=keyword,
            length=str(response["pageInfo"]["totalResults"])))
        return self.__handle_response(response)

    @staticmethod
    def __handle_response(response: Dict[str, Any]) -> List[str]:
        """
        将返回值转换为视频地址
        :param response: api返回值
        :return: 视频连接地址列表
        """
        return [item["id"]["videoId"] for item in response["items"]]
