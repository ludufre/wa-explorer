/**
 * WhatsApp iOS Message Types (ZMESSAGETYPE)
 * Reference: docs/IOS_STORAGE.md
 */
export enum MessageType {
  Text = 0,
  Picture = 1,
  Video = 2,
  Audio = 3,
  Contact = 4,
  Location = 5,
  GroupEvent = 6,
  Link = 7,
  PDF = 8,
  SystemEvent = 10,
  GIF = 11,
  AwaitingMessage = 12,
  DeletedMessage = 14,
  Sticker = 15,
  OfferMessage = 19,
  PhotoWithButton = 20,
  VideoWithButton = 23,
  PDFBusiness = 24,
  LinkReplyWithButton = 25,
  ItemAdvertisementWithButton = 26,
  GroupInvitation = 27,
  DisabledTemporaryMessages = 28,
  TextWithButton = 30,
  ProductCatalog = 31,
  ForwardedItemAdvertisement = 32,
  BusinessPhoto = 33,
  TextReplyWithButton = 34,
  PhotoWithButtons = 35,
  ViewOncePicture = 38,
  ViewOnceVideo = 39,
  LinkWithButton = 41,
  PhotoWithButtonInfo = 42,
  Poll = 46,
  ViewOnceAudio = 53,
  VideoMessage = 54,
  VoiceCallPlaced = 59,
  PhotoGrouping = 66,
}

/**
 * Helper class to categorize message types
 */
export class MessageTypeHelper {
  static isImage(type: number): boolean {
    return [
      MessageType.Picture,
      MessageType.GIF,
      MessageType.Sticker,
      MessageType.PhotoWithButton,
      MessageType.BusinessPhoto,
      MessageType.PhotoWithButtons,
      MessageType.ViewOncePicture,
      MessageType.PhotoWithButtonInfo,
      MessageType.PhotoGrouping,
    ].includes(type);
  }

  static isVideo(type: number): boolean {
    return [
      MessageType.Video,
      MessageType.VideoWithButton,
      MessageType.ViewOnceVideo,
      MessageType.VideoMessage,
    ].includes(type);
  }

  static isAudio(type: number): boolean {
    return [MessageType.Audio, MessageType.ViewOnceAudio].includes(type);
  }

  static isPDF(type: number): boolean {
    return [MessageType.PDF, MessageType.PDFBusiness].includes(type);
  }

  static isViewOnce(type: number): boolean {
    return [
      MessageType.ViewOncePicture,
      MessageType.ViewOnceVideo,
      MessageType.ViewOnceAudio,
    ].includes(type);
  }

  static isSystemMessage(type: number): boolean {
    return [
      MessageType.GroupEvent,
      MessageType.SystemEvent,
      MessageType.DeletedMessage,
      MessageType.DisabledTemporaryMessages,
      MessageType.VoiceCallPlaced,
    ].includes(type);
  }

  static getMediaType(
    type: number,
  ): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'system' | 'other' {
    if (this.isImage(type)) return 'image';
    if (this.isVideo(type)) return 'video';
    if (this.isAudio(type)) return 'audio';
    if (this.isPDF(type)) return 'pdf';
    if (this.isSystemMessage(type)) return 'system';
    if (type === MessageType.Text) return 'text';
    return 'other';
  }
}
