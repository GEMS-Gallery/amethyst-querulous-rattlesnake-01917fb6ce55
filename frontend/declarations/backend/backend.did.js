export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'addFaceDescriptor' : IDL.Func([IDL.Vec(IDL.Float64)], [IDL.Nat], []),
    'compareFaceDescriptor' : IDL.Func(
        [IDL.Vec(IDL.Float64)],
        [IDL.Opt(IDL.Nat)],
        [],
      ),
    'getFaceDescriptors' : IDL.Func(
        [],
        [IDL.Vec(IDL.Vec(IDL.Float64))],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
