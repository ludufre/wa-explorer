export interface ISession {
  Z_PK: number;
  Z_ENT: number;
  Z_OPT: number;
  ZARCHIVED: number;
  ZCONTACTABID: number;
  ZFLAGS: number;
  ZHIDDEN: number;
  ZIDENTITYVERIFICATIONEPOCH: number;
  ZIDENTITYVERIFICATIONSTATE: number;
  ZMESSAGECOUNTER: number;
  ZREMOVED: number;
  ZSESSIONTYPE: number;
  ZSPOTLIGHTSTATUS: number;
  ZUNREADCOUNT: number;
  ZGROUPINFO: number;
  ZLASTMESSAGE: number;
  ZPROPERTIES: number;
  ZLASTMESSAGEDATE: Date;
  ZLOCATIONSHARINGENDDATE: Date;
  ZCONTACTIDENTIFIER: string;
  ZCONTACTJID: string;
  ZETAG: string;
  ZLASTMESSAGETEXT: string;
  ZPARTNERNAME: string;
  ZSAVEDINPUT: string;
}
