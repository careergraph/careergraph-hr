import { GoogleLogin } from "@react-oauth/google";

interface GoogleAuthProps {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess, onError, text = "signin_with" }) => {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          onSuccess(credentialResponse.credential);
        }
      }}
      onError={onError}
      text={text}
      shape="rectangular"
      width="200"
    />
  );
};

export default GoogleAuth;
