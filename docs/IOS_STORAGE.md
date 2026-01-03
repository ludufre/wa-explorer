# iOS Storage Schema

## ZMESSAGETYPE Field Reference

This document describes the schema of the WhatsApp iOS storage database, specifically focusing on the `ZMESSAGETYPE` field found in the `ZWAMESSAGE` table. The `ZMESSAGETYPE` field indicates the type of message stored in each record.

| ZMESSAGETYPE | Meaning |
| ------------ | ------- |
| 0 | Text |
| 1 | Picture |
| 2 | Video |
| 3 | Audio |
| 4 | Contact |
| 5 | Location |
| 6 | [Group Events](#zmessagetype--6-group-events) |
| 7 | Link |
| 8 | PDF |
| 9 | |
| 10 | [System Information Events](#zmessagetype--10-system-information-events) |
| 11 | GIF |
| 12 | Awaiting message |
| 13 | |
| 14 | Deleted message by sender |
| 15 | Sticker |
| 16 | |
| 17 | |
| 18 | |
| 19 | Offer Message |
| 20 | Photo with Button |
| 21 | |
| 22 | |
| 23 | Video with Button |
| 24 | PDF (received from business?) |
| 25 | Link Reply (preview) with Button |
| 26 | Item Advertisement with Button |
| 27 | Group Invitation |
| 28 | You disabled temporary messages |
| 29 | |
| 30 | Text with Button |
| 31 | Product Catalog |
| 32 | Forwarded Item Advertisement |
| 33 | Business Photo (?) |
| 34 | Text Reply with Button |
| 35 | Photo with Buttons (business?) |
| 36 | |
| 37 | |
| 38 | View Once Picture |
| 39 | View Once Video |
| 40 | |
| 41 | Link (preview) with Button |
| 42 | Photo with Button (and Info icon) |
| 43 | |
| 44 | |
| 45 | |
| 46 | Poll |
| 47 | |
| 48 | |
| 49 | |
| 50 | |
| 51 | |
| 52 | |
| 53 | View Once Audio |
| 54 | Video Message |
| 55 | |
| 56 | |
| 57 | |
| 58 | |
| 59 | Voice Call Placed |
| 60 | |
| 61 | |
| 62 | |
| 63 | |
| 64 | |
| 65 | |
| 66 | Photo Grouping (>= 3 photos) |

## ZMESSAGETYPE = 6: Group Events

The `ZGROUPEVENTTYPE` field in the `ZWAMESSAGE` table provides more specific information about group events when `ZMESSAGETYPE` is 6. The following table outlines the meanings of various `ZGROUPEVENTTYPE` values:

| ZGROUPEVENTTYPE | Meaning |
| ---------------- | ------- |
| 1 | |
| 2 | User joined |
| 3 | User left |
| 4 | Group photo changed |
| 5 | Group photo removed |
| 6 | |
| 7 | User removed |
| 8 | |
| 9 | |
| 10 | Became admin |
| 11 | |
| 12 | Group created |
| 15 | |
| 16 | |
| 17 | |
| 18 | |
| 19 | |
| 20 | |
| 21 | |
| 22 | |
| 23 | |
| 26 | |
| 30 | |
| 31 | |
| 32 | |
| 33 | |
| 36 | |
| 37 | |
| 38 | |
| 39 | |
| 41 | |
| 42 | |
| 50 | Users joined |
| 51 | |
| 56 | |
| 57 | |
| 60 | |
| 61 | |
| 64 | |
| 72 | |
| 77 | |

## ZMESSAGETYPE = 10: System Information Events

The `ZSYSTEMEVENTTYPE` field in the `ZWAMESSAGE` table provides more specific information about system information events when `ZMESSAGETYPE` is 10. The following table outlines the meanings of various `ZSYSTEMEVENTTYPE` values:

| ZSYSTEMEVENTTYPE | Meaning |
| ----------------- | ------- |
| 1 | Missed call |
| 2 | Encrypted messages |
| 3 | Encryption key changed |
| 4 | Missed video call |
| 5 | Chatting with old number |
| 6 | Chatting with new number |
| 22 | Missed group video call |
| 25 | Official Business Account |
| 26 | Chat with Business |
| 29 | Business changed name |
| 30 | Account is no longer Business |
| 34 | Contact blocked |
| 35 | Contact unblocked |
| 36 | |
| 38 | Official Business Account |
| 40 | Video Call |
| 41 | Video Call |
| 42 | |
| 45 | Missed call |
| 46 | Missed video call |
| 47 | End-to-end Encryption Key Saved |
| 51 | |
| 56 | Sender added to contacts |
| 58 | |
| 63 | |
| 68 | |
| 71 | |
| 91 | |

## Notes

- [Group and System event types reference](https://github.com/sepinf-inc/IPED/blob/c37e019f1a669296ed25e76173fed42422ad519e/iped-parsers/iped-parsers-impl/src/main/java/iped/parsers/whatsapp/ExtractorIOS.java)
- [Reverse Engineering the iOS Backup](https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup)
