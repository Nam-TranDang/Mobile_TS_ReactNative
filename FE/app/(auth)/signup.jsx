import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    Image,
} from "react-native";
import styles from "../../assets/styles/signup.styles";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { useLanguage } from "../../context/LanguageContext";

export default function Signup() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { user, isLoading, register, token } = useAuthStore();
    const router = useRouter();
    const { t, currentLanguage, changeLanguage } = useLanguage();
    
    const handleSignUp = async() => {
        const result = await register(username, email, password);
        if(result.success) {
            Alert.alert(
                t("login.p18"), 
                t("login.p25"),
                [
                    { 
                        text: "OK", 
                        onPress: () => router.replace("/(auth)") 
                    }
                ]
            );
        } else {
            Alert.alert(t("login.erro"), result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header with back button */}
            <View style={styles.backHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace("/(tabs)")}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>
            <View style={{backgroundColor: COLORS.background, marginTop: -5}}>
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                    bottom={30}
                />
            </View>
            <View style={styles.container}>
                <View style={styles.card}>
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {t("login.signup")}
                        </Text>
                        <Text style={styles.subtitle}>
                            {t("login.p14")}
                        </Text>
                    </View>
                    {/* FORM */}
                    <View style={styles.formContainer}>
                        {/* USERNAME INPUT */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t("login.username")}</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                name="person-outline"
                                size={20}
                                color={COLORS.primary}
                                style={styles.inputIcon}
                                />
                                <TextInput
                                style={styles.input}
                                placeholder="Níng Yìzhuó"
                                placeholderTextColor={COLORS.placeholderText}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* EMAIL INPUT */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={COLORS.primary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="thuvientanvo@gmail.com"
                                placeholderTextColor={COLORS.placeholderText}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            </View>
                        </View>

                        {/* PASSWORD INPUT */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t("login.password")}</Text>
                            <View style={styles.inputContainer}>
                            {/*Left icon */}
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={COLORS.primary}
                                style={styles.inputIcon}
                            />
                            {/*Input */}
                            <TextInput
                                style={styles.input}
                                placeholder="********"
                                placeholderTextColor={COLORS.placeholderText}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                name={showPassword ? "eye-outline":"eye-off-outline" }
                                size={20}
                                color={COLORS.primary}
                                />
                            </TouchableOpacity>
                            </View>
                        </View>

                        {/* SIGNUP BUTTON */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                            <ActivityIndicator color="#fff" />
                            ) : (
                            <Text style={styles.buttonText}>{t("login.signup")}</Text>
                            )}
                        </TouchableOpacity>
                        
                        {/* FOOTER */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{t("login.p26")}</Text>
                            <TouchableOpacity onPress={() => router.replace("(auth)")}>
                                <Text style={styles.link}>{t("login.title")}</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}   