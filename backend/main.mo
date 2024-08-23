import Nat "mo:base/Nat";

import Array "mo:base/Array";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";

actor {
  // Stable variable to store face descriptors
  stable var faceDescriptors : [[Float]] = [];

  // Add a new face descriptor
  public func addFaceDescriptor(descriptor : [Float]) : async Nat {
    faceDescriptors := Array.append(faceDescriptors, [descriptor]);
    return faceDescriptors.size() - 1;
  };

  // Get all stored face descriptors
  public query func getFaceDescriptors() : async [[Float]] {
    return faceDescriptors;
  };

  // Compare a given face descriptor with stored ones
  public func compareFaceDescriptor(descriptor : [Float]) : async ?Nat {
    let threshold : Float = 0.6;
    for (i in Iter.range(0, faceDescriptors.size() - 1)) {
      let distance = euclideanDistance(descriptor, faceDescriptors[i]);
      if (distance < threshold) {
        return ?i;
      };
    };
    return null;
  };

  // Helper function to calculate Euclidean distance between two face descriptors
  private func euclideanDistance(a : [Float], b : [Float]) : Float {
    var sum : Float = 0;
    for (i in Iter.range(0, a.size() - 1)) {
      let diff = a[i] - b[i];
      sum += diff * diff;
    };
    return Float.sqrt(sum);
  };
}
