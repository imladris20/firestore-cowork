import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import ExitIcon from "./assets/exit.png";
import GoogleIcon from "./assets/google.png";
import writing from "./assets/writing.gif";

// Firebase Services
import { initializeApp } from "firebase/app";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
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
  const POLIEN_ID = "ooAwQWDtQddWl3R0zDCykekOS4e2";
  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem("uid")
  );
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
  const [isSearched, setIsSearched] = useState(false);
  const [currentArticlesList, setCurrentArticlesList] = useState([]);

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

  const handleAddUserToFirestore = async (name, email, uid) => {
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
        localStorage.setItem("uid", uid);
        handleAddUserToFirestore(displayName, email, uid);
        setAuthor(uid);
        setCurrentUserId(uid);
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

  const handleLogout = () => {
    setAuthor(null);
    setCurrentUserId(null);
    localStorage.removeItem("uid");
  };

  const handleSearchUsers = async () => {
    setUserName(null);
    setIsSearched(true);
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
  };

  const handleSendRequestToAddFrieds = async () => {
    if (currentUserId) console.log("Send Request to add friends");
    const userRef = doc(db, `users/${userId}`);
    const newData = {
      requests: arrayUnion(currentUserId),
    };

    try {
      await updateDoc(userRef, newData);
      console.log("Data updated successfully.");
    } catch (error) {
      console.error("Error updating data: ", error);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const unsubArticles = onSnapshot(
      query(articles, orderBy("created_time", "desc")),
      async (querySnapshot) => {
        const articlesArr = querySnapshot.docs.map((doc, index) => {
          const singleArticle = doc.data();
          console.log(singleArticle);
          return (
            <Article key={index}>
              <ArticleTitle>標題：{singleArticle.title}</ArticleTitle>
              <ArticleAuthor>作者id：{singleArticle.author_id}</ArticleAuthor>
              <ArticleTag>類別：{singleArticle.tag}</ArticleTag>
              <ArticleContentLabel>內文：</ArticleContentLabel>
              <ArticleContent>{singleArticle.content}</ArticleContent>
            </Article>
          );
        });

        console.log("articlesArr", articlesArr);
        setCurrentArticlesList(articlesArr);
      }
    );

    const unsubUsers = onSnapshot(users, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log("Current users collection of Database: ", doc.data());
      });
    });

    const unsubCurrentUserDoc = onSnapshot(
      doc(db, `users/${currentUserId}`),
      (snapshot) => {
        getFriendsList(snapshot);
        getRequestsList(snapshot);
      }
    );

    return () => {
      unsubUsers();
      unsubArticles();
      unsubCurrentUserDoc();
    };
  }, [currentUserId]);

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
              <RequestAcceptBtn onClick={() => handleAcceptRequest(element)}>
                accept
              </RequestAcceptBtn>
              <RequestDeclineBtn onClick={() => handleDeclineRequest(element)}>
                declined
              </RequestDeclineBtn>
            </FlexRowContainer>
          );
        })
      );
      setRequestsList(newRequestsList);
    } catch (error) {
      console.error("Getting Requests List falied", error);
    }
  }

  async function handleAcceptRequest(toId) {
    const userRef = doc(db, `users/${toId}`);
    const currentUserRef = doc(db, `users/${currentUserId}`);

    const userNewData = {
      friends: arrayUnion(currentUserId),
    };

    const currentUserNewData = {
      friends: arrayUnion(toId),
    };

    const requestToRemove = {
      requests: arrayRemove(toId),
    };

    try {
      await updateDoc(userRef, userNewData);
      await updateDoc(currentUserRef, currentUserNewData);
      console.log("Add new friend to friend list successfully.");
      await updateDoc(currentUserRef, requestToRemove);
      console.log("Remove request successfully.");
    } catch (error) {
      console.error("Error occurred in accepting request: ", error);
    }
  }

  async function handleDeclineRequest(toId) {
    const currentUserRef = doc(db, `users/${currentUserId}`);

    const requestToRemove = {
      requests: arrayRemove(toId),
    };

    try {
      await updateDoc(currentUserRef, requestToRemove);
      console.log("Remove request successfully.");
    } catch (error) {
      console.error("Error occurred in accepting request: ", error);
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
      {!currentUserId ? (
        <>
          <GoogleLoginButton onClick={handleGoogleLogin}>
            <GoogleImg src={GoogleIcon}></GoogleImg>
            <GoogleLoginText>
              Google <br />
              快速登入
            </GoogleLoginText>
          </GoogleLoginButton>
        </>
      ) : (
        <>
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
          <h1>Articles</h1>
          <ArticlesContainer>
            {/* <SearchContainer>
              <TitleLabel>搜尋：</TitleLabel>
              <FriendsContainer>
                <Title
                  type="text"
                  value={targetEmail}
                  onChange={handleFriendsInput}
                />
                <Submit onClick={handleSearchUsers}>送出搜尋</Submit>
              </FriendsContainer>
            </SearchContainer> */}
            {currentArticlesList}
          </ArticlesContainer>
          <h1>Do you have friends?</h1>
          <h2>Your Friends：</h2>
          {friendsList.length ? friendsList : null}
          <h2>Your Pending Requests：</h2>
          {requestsList.length ? requestsList : null}
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
              <h3>用戶名：{userName}</h3>
              <h3>用戶Email：{userEmail}</h3>
              <Submit onClick={handleSendRequestToAddFrieds}>加入好友</Submit>
            </>
          ) : (
            <NoUserText $isSearched={isSearched}>搜尋不到用戶QQ</NoUserText>
          )}
          <LogoutButton onClick={handleLogout}>
            <LogoutImg src={ExitIcon}></LogoutImg>
            <GoogleLoginText>登出</GoogleLoginText>
          </LogoutButton>
        </>
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
  /* position: absolute;
  top: 50px;
  right: 15px; */
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 200px;
  height: 70px;
  margin: 15px auto 25px auto;
  background-color: #ffffff;
  color: black;
  border-radius: 15px;
  border: 1px #979797 solid;
  cursor: pointer;
  /* position: absolute;
  top: 50px;
  right: 15px; */
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

const LogoutImg = styled.img`
  width: 40px;
  padding-top: 2px;
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

const NoUserText = styled.h3`
  visibility: ${(props) => (props.$isSearched ? "visible" : "hidden")};
`;

const RequestAcceptBtn = styled.button`
  width: 70px;
  font-size: 14px;
  background-color: lightblue;
  padding: 5px 5px 5px 5px;
`;

const RequestDeclineBtn = styled(RequestAcceptBtn)`
  background-color: lightpink;
  color: grey;
`;

const ArticlesContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 10px auto;
`;

const Article = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid lightgrey;
  border-radius: 5px;
  margin-bottom: 30px;
  padding: 15px;
`;

const ArticleTitle = styled.h2`
  margin: 0 0 10px 0;
`;

const ArticleAuthor = styled.h3`
  margin: 0;
`;

const ArticleTag = styled.h3`
  margin: 0;
`;

const ArticleContentLabel = styled.h2`
  margin: 20px 0 5px 0;
`;

const ArticleContent = styled.p`
  margin: 0;
`;
