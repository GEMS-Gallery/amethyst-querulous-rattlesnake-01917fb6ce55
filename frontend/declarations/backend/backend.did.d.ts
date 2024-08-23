import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'addFaceDescriptor' : ActorMethod<[Array<number>], bigint>,
  'compareFaceDescriptor' : ActorMethod<[Array<number>], [] | [bigint]>,
  'getFaceDescriptors' : ActorMethod<[], Array<Array<number>>>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
