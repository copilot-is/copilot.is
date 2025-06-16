export type Voice =
  | 'alloy'
  | 'ash'
  | 'coral'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'sage'
  | 'shimmer';

export type OpenAISpeechParams = {
  /**
   * The text to generate audio for. The maximum length is 4096 characters.
   */
  input: string;

  /**
   * One of the available [TTS models](https://platform.openai.com/docs/models#tts):
   * `tts-1` or `tts-1-hd`
   */
  model: string;

  /**
   * The voice to use when generating the audio. Supported voices are `alloy`, `ash`,
   * `coral`, `echo`, `fable`, `onyx`, `nova`, `sage` and `shimmer`. Previews of the
   * voices are available in the
   * [Text to speech guide](https://platform.openai.com/docs/guides/text-to-speech#voice-options).
   */
  voice?: Voice;

  /**
   * The format to audio in. Supported formats are `mp3`, `opus`, `aac`, `flac`,
   * `wav`, and `pcm`.
   */
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

  /**
   * The speed of the generated audio. Select a value from `0.25` to `4.0`. `1.0` is
   * the default.
   */
  speed?: number;
};
