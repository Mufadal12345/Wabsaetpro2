export const extractYoutubeId = (text: string) => {
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = text.match(regExp);
  return match ? match[1] : null;
};

export const getYoutubeThumbnail = (id: string) => {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
};

export const parseHashtags = (text: string) => {
  const hashtags = text.match(/#[\w\u0600-\u06FF]+/g);
  return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
};
