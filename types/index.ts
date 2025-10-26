import { type Session } from 'next-auth';

export { messageSchema } from './message';
export type { MessageMetadata, ChatMessage } from './message';
export type { CustomUIDataTypes, Usage } from './ui-data';
export { attachmentSchema } from './attachment';
export type { Attachment } from './attachment';

export type User = Session['user'];
export type { Chat } from './chat';
export type { ChatPreferences } from './chat-preferences';
export type { UserSettings } from './user-settings';
export type { SystemSettings } from './system-settings';
export type { Model } from './model';
export type { Provider, APIProvider } from './provider';
export type { Result } from './result';
export type { Voice, OpenAISpeechParams } from './speech';
export type { SharedLink } from './shared-link';
