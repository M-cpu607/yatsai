// Stub pour @mediapipe/pose.
// On utilise UNIQUEMENT MoveNet (runtime tfjs) pour la détection de posture,
// jamais BlazePose (qui dépend de @mediapipe/pose). Mais le package
// @tensorflow-models/pose-detection importe statiquement `Pose` depuis
// @mediapipe/pose, ce que le bundler ESM (Vite/rolldown) n'arrive pas à résoudre.
// Ce stub fournit les exports attendus, jamais utilisés à l'exécution.
export class Pose {}
export const POSE_CONNECTIONS = [];
export const POSE_LANDMARKS = {};
export const VERSION = '0.0.0-stub';
export default {};
