import styles from "./index.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { __x, __o } from '../tools/defaults';
import { trpc } from "../utils/trpc";

import dynamic from "next/dynamic";
const Spine = dynamic(() => import("../components/SpineComponent"), { ssr: false });


const Home: NextPage = () => {
  const hello = trpc.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Spine/>

    </>
  );
};

export default Home;
