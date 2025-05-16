import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import style from '../../assets/styles/create.styles';
import COLORS from '../../constants/colors';

import * as FileSystem from "expo-file-system"; // npx expo install expo-file-system 
import * as ImagePicker from "expo-image-picker"; // npx expo install expo-image-picker
import { ActivityIndicator } from 'react-native-web';



export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null); // to display the selected image
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  
  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access camera roll is required!");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, //lower quality for faster upload
        base64: true,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);

        // if base64 is provided
        if(result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          // otherwise, convert the image to base64
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        setImageBase64(base64);
      }
    }catch (error) 
    {
      console.error("Error picking image: ", error);
      Alert.alert("Error picking image");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64) {
      Alert.alert("Please fill in all fields and select an image");
      return;
    }
    
  };

  const renderRatingPicker = () => { 
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={style.starButton}>

        <Ionicons
          name={i <= rating ? "star" : "star-outline"}
          size={32}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
          </TouchableOpacity>
      );
    }   
    return <View style={style.ratingContainer}>{stars}</View> };

  return (
    <KeyboardAvoidingView
    style={{flex: 1}}
     behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={style.container} style={style.scrollViewStyle}>

      <View style ={style.card}>
        {/* Header */}
        <View style={style.header}>
          <Text style={style.title}>Add Book Recommendation</Text>
          <Text style={style.subtitle}>Share your favorite reads with others</Text>
        </View>

        <View style={style.form}>
          {/* Book Title */}
          <View style={style.formGroup}>
            <Text style={style.label}>Book Title</Text>
            <View style={style.inputContainer}>
              <Ionicons 
                name="book-outline" 
                size={20} 
                color={COLORS.textSecondary}
                style={style.inputIcon} 
              />
              <TextInput
                style={style.input}
                placeholder="Enter book title"
                placeholderTextColor={COLORS.placeholderText}
                value={title}
                onChangeText={setTitle}
              />
          </View>
          {/* Rating */}
          <View style={style.formGroup}>
            <Text style={style.label}>Your Rating</Text>
            {renderRatingPicker()}
          </View>
          {/* Image */}
          <View style={style.formGroup}></View>
            <Text style={style.label}>Book Image</Text>
            <TouchableOpacity style={style.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={style.previewImage} />
              ) : (
                <View style={style.placeholderContainer}>
                  <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={style.placeholderText}>Select Image</Text>
                </View>
                )}  
              </TouchableOpacity>
            </View>
          {/* Caption */}
          <View style={style.formGroup}>
            <Text style={style.label}>Caption</Text>
            <TextInput
              style={style.textArea}
              placeholder="Write a caption..."
              placeholderTextColor={COLORS.placeholderText}
              value={caption}
              onChangeText={setCaption}
              multiline
            />
            </View>
          {/* Submit Button */}
          <TouchableOpacity
            style={style.button}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white}  />
            ) : (
              <>
              <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} style={style.buttonIcon} 
              />
              <Text style={style.buttonText}>Submit</Text>
              </>
            )}
            </TouchableOpacity>
      </View>

      </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
} 