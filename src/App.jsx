import { useEffect, useState } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import GoogleIcon from "./assets/google.png";
import writing from "./assets/writing.gif";

// Firebase Services
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

//  Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA75IRqaTwXBiOX5cVkUEeM3tyl09EMsXI",
  authDomain: "test-firestore-polien.firebaseapp.com",
  projectId: "test-firestore-polien",
  storageBucket: "test-firestore-polien.appspot.com",
  messagingSenderId: "264671613600",
  appId: "1:264671613600:web:1fb15821757b90404a6fc5",
  measurementId: "G-KDE5BW1C7K",
};
const firebaseApp = initializeApp(firebaseConfig);

//  Initialize Firestore
const db = getFirestore(firebaseApp);

//  Authentication
const auth = getAuth();
const provider = new GoogleAuthProvider();
auth.languageCode = "zh-TW";

function App() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [currentTag, setCurrentTag] = useState("請選擇文章類別");

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleAuthorChange = (e) => {
    setAuthor(e.target.value);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handlePostArticle = async () => {
    try {
      const id = uuidv4();
      const docRef = doc(db, `articles/${id}`);
      await setDoc(docRef, {
        title,
        content,
        author_id: author,
        created_time: new serverTimestamp(),
        tag: currentTag,
        id,
      });
      setTitle("");
      setAuthor("");
      setContent("");
      setCurrentTag("請選擇文章類別");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleChangeTag = (event) => {
    setCurrentTag(event.target.value);
  };

  const handleGoogleLogin = () => {
    console.log("click on google login");
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        localStorage.setItem("GoogleAccessToken", token);
        console.log("GoogleAccessToken", token);
        // The signed-in user info.
        const user = result.user;
        console.log("result user", user);
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articles"), (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log("Current articles collection of Database: ", doc.data());
      });
    });

    return () => {
      unsub();
    };
  }, []);

  return (
    <>
      <div>
        <a
          href="https://console.firebase.google.com/u/3/project/test-firestore-polien/firestore/data"
          target="_blank"
        >
          <img src={writing} className="logo react" alt="Writing logo" />
        </a>
      </div>
      <h1>Posting Your Articles!</h1>
      <GoogleLoginButton onClick={handleGoogleLogin}>
        <GoogleImg src={GoogleIcon}></GoogleImg>
        <GoogleLoginText>使用Google 快速登入</GoogleLoginText>
      </GoogleLoginButton>
      <AllInputContainer>
        <InputContainer>
          <TitleLabel>標題：</TitleLabel>
          <Title type="text" value={title} onChange={handleTitleChange} />
        </InputContainer>
        <InputContainer>
          <TitleLabel>作者：</TitleLabel>
          <Title type="text" value={author} onChange={handleAuthorChange} />
        </InputContainer>
        <InputContainer>
          <TagLabel>Tag：</TagLabel>
          <TagSelect
            value={currentTag}
            name="tag"
            onChange={(event) => handleChangeTag(event)}
          >
            <TagOption>請選擇文章類別</TagOption>
            <TagOption>Beauty</TagOption>
            <TagOption>Gossiping</TagOption>
            <TagOption>SchoolLife</TagOption>
          </TagSelect>
        </InputContainer>
        <ContentContainer>
          <TitleLabel>內容：</TitleLabel>
          <ContentInput
            type="text"
            value={content}
            onChange={handleContentChange}
          />
        </ContentContainer>
        <Submit onClick={handlePostArticle}>發表文章</Submit>
      </AllInputContainer>
    </>
  );
}

export default App;

//  Styled Components
const TitleLabel = styled.label`
  color: #3f3a3a;
  font-size: 22px;
  line-height: 25px;
  margin-right: 20px;
  text-align: left;
`;

const Title = styled.input`
  border-radius: 8px;
  border: 1px #979797 solid;
  height: 32px;
  line-height: 32px;
  padding-left: 10px;
  font-size: 22px;
  color: #3f3a3a;
  font-size: 22px;
`;

const AllInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: center;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
`;

const ContentInput = styled.textarea`
  width: 100%;
  height: 400px;
  text-align: left;
  vertical-align: top;
  border-radius: 8px;
  border: 1px #979797 solid;
  line-height: 32px;
  font-size: 22px;
  color: #3f3a3a;
  font-size: 22px;
`;

const Submit = styled.button`
  background-color: black;
  width: 100%;
  color: white;
  font-size: 16px;
  font-family: Noto Sans TC;
  font-weight: 400;
  line-height: 30px;
  letter-spacing: 3.2px;
  word-wrap: break-word;
  border: none;
  height: 44px;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    background-color: #cccccc;
  }
`;

const TagLabel = styled(TitleLabel)`
  margin-right: 28px;
`;

const TagSelect = styled.select`
  border: 1px #979797 solid;
  background: #f3f3f3;
  border-radius: 8px;
  height: 35px;
  width: 282px;
  align-self: end;
  justify-self: center;
  padding-left: 11px;
  color: #3f3a3a;
  font-size: 14px;
  line-height: 16px;
  cursor: pointer;
`;

const TagOption = styled.option`
  width: 200px;
`;

const GoogleLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 300px;
  height: 48px;
  margin: 0 auto 25px auto;
  background-color: #ffffff;
  color: black;
  border-radius: 15px;
  border: 1px #979797 solid;
  cursor: pointer;
  position: absolute;
  top: 50px;
  right: 15px;
`;

const GoogleImg = styled.img`
  width: 40px;
  padding-top: 2px;
`;

const GoogleLoginText = styled.div`
  color: black;
  width: 245px;
  font-size: 20px;
`;
