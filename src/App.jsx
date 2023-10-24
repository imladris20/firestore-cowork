import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import GoogleIcon from "./assets/google.png";
import writing from "./assets/writing.gif";

// Firebase Services
import { initializeApp } from "firebase/app";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
const articles = collection(db, "articles");
const users = collection(db, "users");

//  Authentication
const auth = getAuth();
const provider = new GoogleAuthProvider();
auth.languageCode = "zh-TW";

function App() {
  const MY_ID = "ooAwQWDtQddWl3R0zDCykekOS4e2";
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [currentTag, setCurrentTag] = useState("請選擇文章類別");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [friendsList, setFriendsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleChangeTag = (e) => {
    setCurrentTag(e.target.value);
  };

  const handleFriendsInput = (e) => {
    setTargetEmail(e.target.value);
  };

  const handlePostArticle = async () => {
    try {
      const newDoc = await addDoc(articles, {
        title,
        content,
        author_id: author,
        created_time: new serverTimestamp(),
        tag: currentTag,
      });
      setTitle("");
      setContent("");
      setCurrentTag("請選擇文章類別");
    } catch (e) {
      console.error("Error adding document to articles collection: ", e);
    }
  };

  const handleAddUsers = async (name, email, uid) => {
    try {
      const userRef = doc(db, `users/${uid}`);
      const newUser = await setDoc(
        userRef,
        {
          name,
          email,
          friends: [],
          requests: [],
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error adding document to users collection: ", e);
    }
  };

  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        localStorage.setItem("GoogleAccessToken", token);
        const { displayName, email, uid } = result.user;
        handleAddUsers(displayName, email, uid);
        setAuthor(uid);
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);

        console.error(errorCode, errorMessage, email, credential);
      });
  };

  const handleSearchUsers = async () => {
    setUserName(null);
    async function queryingTargetUser() {
      const userQuery = query(users, where("email", "==", targetEmail));
      const querySnapshot = await getDocs(userQuery);
      const matchUsers = querySnapshot.forEach((snap) => {
        const { email, name } = snap.data();
        setUserEmail(email);
        setUserName(name);
        setUserId(snap.id);
        console.log(
          `${name}'s information --> username: ${name}, useremail: ${email}, uid: ${snap.id}`
        );
      });
    }
    queryingTargetUser();
    setTargetEmail("");
  };

  const handleAddFrieds = async () => {
    console.log("click add friends");
    const userRef = doc(db, `users/${userId}`);
    const newData = {
      requests: arrayUnion(MY_ID),
    };

    try {
      await updateDoc(userRef, newData);
      console.log("Data updated successfully.");
    } catch (e) {
      console.error("Error updating data: ", e);
    }
  };

  useEffect(() => {
    const unsubArticles = onSnapshot(articles, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log("Current articles collection of Database: ", doc.data());
      });
    });

    const unsubUsers = onSnapshot(users, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log("Current users collection of Database: ", doc.data());
      });
    });

    const unsubMyDoc = onSnapshot(doc(db, `users/${MY_ID}`), (snapshot) => {
      getFriendsList(snapshot);
      getRequestsList(snapshot);
    });

    return () => {
      unsubUsers();
      unsubArticles();
      unsubMyDoc();
    };
  }, []);

  async function getFriendsList(snapshot) {
    try {
      const friendsArr = snapshot.data().friends;
      const newFriendList = await Promise.all(
        friendsArr.map(async (element, index) => {
          const othersRef = doc(db, `users/${element}`);
          const othersSnapShot = await getDoc(othersRef);
          const othersData = othersSnapShot.data();
          const { name, email } = othersData;
          return (
            <FlexRowContainer key={index}>
              <h4>姓名：{name}</h4>
              <h4>信箱：{email}</h4>
            </FlexRowContainer>
          );
        })
      );
      setFriendsList(newFriendList);
    } catch (error) {
      console.error("Getting Friend List falied", error);
    }
  }

  async function getRequestsList(snapshot) {
    try {
      const requestsArr = snapshot.data().requests;
      const newRequestsList = await Promise.all(
        requestsArr.map(async (element, index) => {
          const othersRef = doc(db, `users/${element}`);
          const othersSnapShot = await getDoc(othersRef);
          const othersData = othersSnapShot.data();
          console.log("othersData in requestsList", othersData);
          const { name, email } = othersData;
          return (
            <FlexRowContainer key={index}>
              <h5>姓名：{name}</h5>
              <h5>信箱：{email}</h5>
              <button>accept</button>
            </FlexRowContainer>
          );
        })
      );
      setRequestsList(newRequestsList);
    } catch (error) {
      console.error("Getting Requests List falied", error);
    }
  }

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
        <GoogleLoginText>
          Google <br />
          快速登入
        </GoogleLoginText>
      </GoogleLoginButton>
      <AllInputContainer>
        <InputContainer>
          <TitleLabel>標題：</TitleLabel>
          <Title type="text" value={title} onChange={handleTitleChange} />
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
      <h1>Do you have friends?</h1>
      <h2>Your Friends：</h2>
      {friendsList}
      <h2>Your Pending Requests：</h2>
      {requestsList}
      <SearchContainer>
        <TitleLabel>搜尋：</TitleLabel>
        <FriendsContainer>
          <Title
            type="text"
            value={targetEmail}
            onChange={handleFriendsInput}
          />
          <Submit onClick={handleSearchUsers}>送出搜尋</Submit>
        </FriendsContainer>
      </SearchContainer>
      {userName ? (
        <>
          <h2>用戶名：{userName}</h2>
          <h2>用戶Email：{userEmail}</h2>
          <Submit onClick={handleAddFrieds}>加入好友</Submit>
        </>
      ) : (
        <h2>搜尋不到用戶QQ</h2>
      )}
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

const FriendsContainer = styled(InputContainer)`
  margin-top: 5px;
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
  width: 200px;
  height: 70px;
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
  width: 60px;
  padding-top: 2px;
`;

const GoogleLoginText = styled.div`
  color: black;
  width: 245px;
  font-size: 20px;
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 40px;
`;

const FlexRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 15px;
  height: 40px;
  align-items: center;
`;
