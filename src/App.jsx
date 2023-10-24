import "./App.css";
import writing from "./assets/writing.gif";

import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyA75IRqaTwXBiOX5cVkUEeM3tyl09EMsXI",
  authDomain: "test-firestore-polien.firebaseapp.com",
  projectId: "test-firestore-polien",
  storageBucket: "test-firestore-polien.appspot.com",
  messagingSenderId: "264671613600",
  appId: "1:264671613600:web:1fb15821757b90404a6fc5",
  measurementId: "G-KDE5BW1C7K",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

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
        created_time: new Date(),
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
          href="https://firebase.google.com/docs/firestore/quickstart?hl=zh-tw&authuser=0"
          target="_blank"
        >
          <img src={writing} className="logo react" alt="Writing logo" />
        </a>
      </div>
      <h1>Posting Your Articles!</h1>
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
