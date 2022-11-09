import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  ImageComponent,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEventListener,
  Animated,
} from "react-native";
import useAuth from "../auth/useAuth";
import AppButton from "../components/AppButton";
import {
  AppForm,
  AppFormField,
  ErrorMessage,
  SubmitButton,
} from "../components/forms";
import colors from "../config/colors";
import routes from "../navigation/routes";
import * as Yup from "yup";
import authApi from "../api/auth";
import { TouchableOpacity } from "react-native-gesture-handler";
import AppText from "../components/AppText";
import ListItemSeparator from "../components/ListItemSeparator";
import * as AuthSession from "expo-auth-session";
import useApi from "../hooks/useApi";
import usersApi from "../api/users";
import { environment } from "../../enviroment";
import { useToast } from "native-base";

interface AuthResponse {
  params: {
    access_token: string;
  };
  type: string;
}

const validationSchema = Yup.object().shape({
  email: Yup.string().required("O campo email é obrigatório").label("Email"),
  password: Yup.string()
    .required("O campo senha é obrigatório")
    .min(4)
    .label("Senha"),
});

export default function WelcomeScreen() {
  const toast = useToast();
  const navigation = useNavigation();
  const auth = useAuth();
  const loginApi = useApi(authApi.login);
  const registerApi = useApi(usersApi.register);

  const [loginFailed, setLoginFailed] = useState(false);
  const [showLogo, setShowLogo] = useState(true);

  async function handleGoogleSignIn() {
    try {
      // Connect to google oauth API
      const CLIENT_ID = environment.googleClientId;
      const REDIRECT_URI = "https://auth.expo.io/@fonseca90/trena";
      const SCOPE = encodeURI("profile email");
      const RESPONSE_TYPE = "token";

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
      const { type, params } = (await AuthSession.startAsync({
        authUrl,
      })) as AuthResponse;
      if (type === "success") {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`
        );
        const user = await response.json();

        // Register a new user using the token (10 first chars) as password
        const result: any = await registerApi.request({
          name: user.name,
          email: user.email,
          picture: user.picture,
          password: params.access_token.substring(0, 10),
        });

        // Login with created email and password
        const { data }: any = await loginApi.request(
          user.email,
          params.access_token.substring(0, 10)
        );
        auth.logIn(data.access_token);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleSubmit = async ({ email, password }: any) => {
    const result = (await authApi.login(email, password)) as any;
    console.log({ username: email, password: password });
    console.log(result);
    if (!result.ok) {
      toast.show({
        title: "Email ou senha inválidos",
        placement: "top",
        bgColor: "red.500",
      });
    } //return setLoginFailed(true);
    setLoginFailed(false);
    console.log(result.data.access_token);
    auth.logIn(result.data.access_token);
  };

  function keyboardDidShow() {
    setShowLogo(false);
  }

  function keyboardDidHide() {
    setShowLogo(true);
  }

  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", keyboardDidShow);
    Keyboard.addListener("keyboardDidHide", keyboardDidHide);
  }, [Keyboard]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.background}>
        {showLogo && (
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              source={require("../assets/trena_dark.png")}
            ></Image>
          </View>
        )}
        <View style={styles.buttonsContainer}>
          <AppForm
            initialValues={{ email: "", password: "" }}
            onSubmit={handleSubmit}
            validationSchema={validationSchema}
          >
            <ErrorMessage
              error="Email ou senha inválido."
              visible={loginFailed}
            ></ErrorMessage>
            <AppFormField
              autoCapitalize="none"
              autoCorrect={false}
              // caretHidden={false}
              icon="email"
              keyboardType="email-address"
              name="email"
              placeholder="Email"
              textContetType="emailAddress"
            ></AppFormField>
            <AppFormField
              autoCapitalize="none"
              autoCorrect={false}
              icon="lock"
              name="password"
              placeholder="Senha"
              secureTextEntry
              textContetType="password"
            ></AppFormField>
            <SubmitButton
              color={colors.trenaGreen}
              title="Entrar"
            ></SubmitButton>
          </AppForm>
          <View style={styles.registerContainer}>
            <AppText style={styles.newUserText}>Não tem conta?</AppText>
            <TouchableOpacity
              onPress={() => navigation.navigate(routes.REGISTER)}
            >
              <AppText style={styles.registerText}>Cadastre aqui</AppText>
            </TouchableOpacity>
          </View>
          <View style={styles.registerContainer}>
            <ListItemSeparator />
            <AppText style={styles.registerText}>OU</AppText>
            <ListItemSeparator />
          </View>
          <TouchableOpacity onPress={handleGoogleSignIn}>
            <View style={styles.googleButton}>
              <Image
                style={styles.socialIcon}
                source={require("../assets/google.png")}
              ></Image>
              <Text style={styles.googleText}>Entrar com Google</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert("Disponível em breve")}>
            <View style={styles.facebookButton}>
              <Image
                style={styles.socialIcon}
                source={require("../assets/facebook.png")}
              ></Image>
              <Text style={styles.facebookText}>Entrar com Facebook</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "space-around",
    alignItems: "center",
  },
  buttonsContainer: {
    padding: 20,
    width: "100%",
    marginTop: 20,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  registerText: {
    paddingLeft: 8,
    paddingRight: 8,
    color: colors.trenaGreen,
  },
  logo: {
    height: 200,
    width: 200,
  },
  loginButton: {
    backgroundColor: "#73FF00",
  },
  logoContainer: {
    padding: 12,
    alignItems: "center",
  },
  googleButton: {
    color: colors.white,
    backgroundColor: colors.light,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    width: "100%",
    marginVertical: 10,
    flexDirection: "row",
  },
  googleText: {
    color: colors.medium,
    fontSize: 18,
    paddingLeft: 32,
    fontWeight: "bold",
  },
  facebookButton: {
    color: colors.white,
    backgroundColor: colors.facebookBlue,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    width: "100%",
    marginVertical: 10,
    flexDirection: "row",
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  facebookText: {
    color: colors.light,
    // textTransform: "uppercase",
    paddingLeft: 32,
    fontSize: 18,
    fontWeight: "bold",
  },
  tagLine: {
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 20,
  },
  newUserText: {
    color: colors.light,
  },
});
