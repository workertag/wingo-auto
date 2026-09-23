--
-- PostgreSQL database dump
--

\restrict zs2NsgSAajajtifZi6bDmQCNAZX4Y3GRmssYjhm4PN1Fc4GnTMwet1AVMRBGWGN

-- Dumped from database version 18.3 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BetRecord; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."BetRecord" (
    id text NOT NULL,
    "botInstanceId" text NOT NULL,
    issue text NOT NULL,
    "betType" text NOT NULL,
    amount double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    profit double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BetRecord" OWNER TO sourav;

--
-- Name: BotInstance; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."BotInstance" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "endpointId" text,
    "wingoPhone" text,
    "wingoEmail" text,
    "wingoPasswordAuth" text NOT NULL,
    status text DEFAULT 'STOPPED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    settings jsonb,
    "currentBalance" double precision DEFAULT 0 NOT NULL,
    "sessionLosses" integer DEFAULT 0 NOT NULL,
    "sessionWins" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."BotInstance" OWNER TO sourav;

--
-- Name: BotSession; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."BotSession" (
    id text NOT NULL,
    date text NOT NULL,
    "timeSlotId" text,
    "timeSlotName" text,
    "strategyId" text,
    "strategyName" text,
    "initialBalance" double precision,
    "finalBalance" double precision,
    "totalWins" integer DEFAULT 0 NOT NULL,
    "totalLosses" integer DEFAULT 0 NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "botInstanceId" text
);


ALTER TABLE public."BotSession" OWNER TO sourav;

--
-- Name: NetworkEndpoint; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."NetworkEndpoint" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    host text NOT NULL,
    port integer NOT NULL,
    "proxyUser" text,
    "proxyPass" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NetworkEndpoint" OWNER TO sourav;

--
-- Name: Strategy; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."Strategy" (
    id text NOT NULL,
    name text NOT NULL,
    "minLevel" integer DEFAULT 1 NOT NULL,
    "maxLevel" integer DEFAULT 7 NOT NULL,
    "maxWins" integer,
    "maxLosses" integer,
    levels integer[],
    config jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Strategy" OWNER TO sourav;

--
-- Name: TimeSlot; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."TimeSlot" (
    id text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TimeSlot" OWNER TO sourav;

--
-- Name: User; Type: TABLE; Schema: public; Owner: sourav
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    role text DEFAULT 'USER'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO sourav;

--
-- Data for Name: BetRecord; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."BetRecord" (id, "botInstanceId", issue, "betType", amount, status, profit, "createdAt", "updatedAt") FROM stdin;
36e55df2-9ddc-4eea-ad1d-8593878e87b3	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051312	SMALL	2	LOST	-2	2026-09-22 10:55:35.979	2026-09-22 10:56:02.941
bdaf959f-a35a-4529-923e-4ab936924827	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051312	GREEN	4	WON	3.84	2026-09-22 10:55:37.201	2026-09-22 10:56:02.941
ae62fb40-87b2-4593-b948-ed60999ff093	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051313	BIG	4	WON	3.84	2026-09-22 10:56:06.033	2026-09-22 10:56:32.877
97dd9d57-a40e-4c47-b858-ae769369891d	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051313	GREEN	1	LOST	-1	2026-09-22 10:56:06.759	2026-09-22 10:56:32.877
a992f642-7c89-4de9-bfb9-2de4c11cda80	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051306	SMALL	4	WON	3.84	2026-09-22 10:52:36.1	2026-09-22 10:53:02.834
90e30e0a-eb70-4bc6-b17e-8df558744602	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051306	RED	4	LOST	-4	2026-09-22 10:52:37.33	2026-09-22 10:53:02.835
8fcc519c-3886-45de-8b38-fa46319aaee9	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051307	GREEN	8	WON	3.76	2026-09-22 10:53:06.499	2026-09-22 10:53:32.815
122686a1-9c40-44e4-a3b8-61a8447c4605	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051307	BIG	1	WON	0.96	2026-09-22 10:53:05.271	2026-09-22 10:53:32.815
27818792-4b84-4898-8bac-e9baa6f5512e	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051308	GREEN	1	LOST	-1	2026-09-22 10:53:34.761	2026-09-22 10:54:02.878
e819cdcb-be88-4a3f-94fd-db21db68e68d	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051308	SMALL	1	LOST	-1	2026-09-22 10:53:34.044	2026-09-22 10:54:02.878
0b2ca0ee-3dc3-4df7-b778-f5a2cb45f591	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051309	GREEN	2	WON	1.92	2026-09-22 10:54:06.443	2026-09-22 10:54:32.826
b327e696-f961-475c-b218-ff40ef8b7e20	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051309	SMALL	2	WON	1.92	2026-09-22 10:54:05.218	2026-09-22 10:54:32.826
c832b105-6503-4cdf-932f-fcf95e4cd8b9	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051310	BIG	1	WON	0.96	2026-09-22 10:54:34.082	2026-09-22 10:55:03.044
358cb3fe-64d9-4e3e-b048-79ef61208875	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051310	GREEN	1	LOST	-1	2026-09-22 10:54:34.8	2026-09-22 10:55:03.044
faecbf81-29a5-49d6-a07b-899bccf46b83	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051311	RED	2	LOST	-2	2026-09-22 10:55:07.057	2026-09-22 10:55:32.876
d58dba59-562f-4d1e-99e3-bddf79a0981a	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051311	SMALL	1	LOST	-1	2026-09-22 10:55:05.83	2026-09-22 10:55:32.876
bfa59d81-0e41-4802-aca9-b295a78e8df6	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051314	GREEN	2	WON	1.92	2026-09-22 10:56:36.094	2026-09-22 10:57:02.889
862f22a5-0df8-4e80-807f-91d638bfbe53	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051314	BIG	1	LOST	-1	2026-09-22 10:56:34.86	2026-09-22 10:57:02.889
4abad0c5-a7a0-4002-8f59-991c606559cd	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051315	BIG	2	WON	1.92	2026-09-22 10:57:06.474	2026-09-22 10:57:32.992
b1ed264e-04fe-43a0-be65-956f466f9748	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051315	GREEN	1	LOST	-1	2026-09-22 10:57:07.193	2026-09-22 10:57:32.992
e510bedb-de25-4a30-b87b-153f40a8b80a	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051316	SMALL	1	WON	0.96	2026-09-22 10:57:36.128	2026-09-22 10:58:06.29
6195211e-3f20-4253-834d-d67be6f984ad	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051316	GREEN	2	LOST	-2	2026-09-22 10:57:37.356	2026-09-22 10:58:06.29
19bf8769-c372-4038-a504-35fcb6e9075f	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051317	BIG	1	WON	0.96	2026-09-22 10:58:08.092	2026-09-22 10:58:33.245
f0ebd6fb-c21c-4c44-bde8-8218c7171b01	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051317	RED	4	LOST	-4	2026-09-22 10:58:09.315	2026-09-22 10:58:33.245
e7b198ce-bbcb-4892-b79e-b1dea0dd9ad5	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051318	GREEN	8	LOST	-8	2026-09-22 10:58:37.299	2026-09-22 10:59:03.079
636fa597-14f8-4704-abcd-1638a802b39f	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051318	SMALL	1	LOST	-1	2026-09-22 10:58:36.074	2026-09-22 10:59:03.079
9d71cb8c-2c7d-4301-945d-14638642bff5	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051319	SMALL	2	WON	1.92	2026-09-22 10:59:06.491	2026-09-22 10:59:33.731
c7fa909c-57bd-487b-9673-86411611267e	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051319	RED	16	WON	7.52	2026-09-22 10:59:07.712	2026-09-22 10:59:33.731
f63846a3-e083-4eb6-bf52-08c81b116c10	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051320	BIG	1	WON	0.96	2026-09-22 10:59:35.855	2026-09-22 11:00:02.967
8dd183eb-c0b3-44fd-9f00-662b447a0590	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051320	RED	1	LOST	-1	2026-09-22 10:59:36.573	2026-09-22 11:00:02.967
792a7580-0b2e-466c-a600-638f0939c05d	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051321	SMALL	1	LOST	-1	2026-09-22 11:00:04.782	2026-09-22 11:00:32.932
efe1840d-ef6f-4b28-827d-afd3a354dfab	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051321	GREEN	2	WON	1.92	2026-09-22 11:00:06.01	2026-09-22 11:00:32.932
fcb9435e-2b92-4d66-bda1-550e7a3eec91	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051322	SMALL	2	LOST	-2	2026-09-22 11:00:36.024	2026-09-22 11:01:02.9
f5f78e3b-a052-415a-b1f6-5082ffe07223	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051322	GREEN	1	WON	0.96	2026-09-22 11:00:36.747	2026-09-22 11:01:02.9
bdac7350-8050-4b92-b1ee-f1282f36041b	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051323	BIG	4	WON	3.84	2026-09-22 11:01:05.558	2026-09-22 11:01:32.923
396256a7-45bb-4d4d-86a2-1c6553035c00	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051323	GREEN	1	WON	0.47	2026-09-22 11:01:06.289	2026-09-22 11:01:32.923
ece93237-a412-4c93-86a9-da99aa86ea21	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051324	BIG	1	LOST	-1	2026-09-22 11:01:35.048	2026-09-22 11:02:02.925
82227303-4562-4ba7-9bae-982e41d81d36	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051324	GREEN	1	WON	0.96	2026-09-22 11:01:35.768	2026-09-22 11:02:02.926
c9160f5e-441d-491e-8aed-cff7168609e0	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051325	BIG	2	WON	1.92	2026-09-22 11:02:05.421	2026-09-22 11:02:32.942
56300ac7-d9d3-42ea-85f4-2b9cf2c9dc3e	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051325	GREEN	1	LOST	-1	2026-09-22 11:02:06.14	2026-09-22 11:02:32.942
478b558b-e7ca-42f6-9409-24b41d77ae44	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051326	SMALL	1	LOST	-1	2026-09-22 11:02:34.312	2026-09-22 11:03:02.948
6b40d9b2-6674-4491-8e75-4782798f337e	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051326	RED	2	LOST	-2	2026-09-22 11:02:35.54	2026-09-22 11:03:02.948
d4bf2e1b-f293-4f0d-83f1-6c138bfa863f	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051327	SMALL	2	WON	1.92	2026-09-22 11:03:05.756	2026-09-22 11:03:32.959
3dbff1a5-9409-4359-a414-3c47dc94efc8	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051327	GREEN	4	LOST	-4	2026-09-22 11:03:06.98	2026-09-22 11:03:32.959
8ee76039-b75e-4668-8755-b30cc63c94ca	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051328	RED	8	LOST	-8	2026-09-22 11:03:36.161	2026-09-22 11:04:02.956
4b8abfd4-513e-4a9d-8bf4-b3b0c17ed1ae	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051328	BIG	1	WON	0.96	2026-09-22 11:03:34.93	2026-09-22 11:04:02.956
738038a2-fb68-4e6c-b503-e420c0fb6aaa	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051329	SMALL	1	LOST	-1	2026-09-22 11:04:05.065	2026-09-22 11:04:32.969
0b9de097-3181-471b-a4c4-333e31ab3616	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051329	RED	16	WON	15.36	2026-09-22 11:04:06.291	2026-09-22 11:04:32.969
942ea4c7-e97c-4d76-99f1-e2ba7a1ba4f4	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051330	SMALL	2	LOST	-2	2026-09-22 11:04:36.287	2026-09-22 11:05:02.964
a1ebc754-9a02-45c0-8fdc-239449209c63	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051330	RED	1	LOST	-1	2026-09-22 11:04:37.005	2026-09-22 11:05:02.965
c1bcedad-b8d4-4bea-99fa-e015467566b0	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051331	GREEN	2	LOST	-2	2026-09-22 11:05:07.645	2026-09-22 11:05:32.945
040517fb-8912-43ab-8910-b05dd60d0c57	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051331	BIG	4	WON	3.84	2026-09-22 11:05:06.423	2026-09-22 11:05:32.945
da136cfc-3b2b-4080-8ab8-751ef0299397	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051332	RED	4	LOST	-4	2026-09-22 11:05:37.377	2026-09-22 11:06:02.95
8dec5ff9-84eb-4cf8-be01-829200c94d09	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051332	BIG	1	WON	0.96	2026-09-22 11:05:36.163	2026-09-22 11:06:02.95
7f20743f-f85a-4952-9e47-12188953e650	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051333	RED	8	WON	3.76	2026-09-22 11:06:07.272	2026-09-22 11:06:32.966
88362612-289a-4a14-ac58-9464d3e22734	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051333	BIG	1	LOST	-1	2026-09-22 11:06:06.047	2026-09-22 11:06:32.966
96026f0d-5940-4990-b7dd-31f07068128f	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051334	GREEN	1	WON	0.96	2026-09-22 11:06:36.552	2026-09-22 11:07:03.064
2e004a52-bee6-49bf-8f12-2fe83c4b1be5	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051334	BIG	2	LOST	-2	2026-09-22 11:06:35.836	2026-09-22 11:07:03.064
b21ec33d-adf0-4349-8505-ec9a7b36f12b	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051335	BIG	4	LOST	-4	2026-09-22 11:07:05.752	2026-09-22 11:07:32.893
885687d9-2d53-498b-bda4-329281bca34d	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051335	RED	1	WON	0.47	2026-09-22 11:07:06.47	2026-09-22 11:07:32.893
88f8cee1-4389-4939-af43-f28fd44a2bea	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051336	GREEN	1	LOST	-1	2026-09-22 11:07:36.788	2026-09-22 11:08:03.175
bfb269c3-70c3-4db1-94de-21afdd16b009	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051336	BIG	8	LOST	-8	2026-09-22 11:07:36.074	2026-09-22 11:08:03.175
a2ab446d-127e-4e52-8cac-db383fc6bd04	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051337	BIG	16	WON	15.36	2026-09-22 11:08:06.131	2026-09-22 11:08:32.708
7688b594-b5d6-4cfe-894b-bdb371bf8353	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051337	GREEN	2	WON	0.94	2026-09-22 11:08:07.352	2026-09-22 11:08:32.708
d65b8370-97be-4b5e-aacc-030cebf2f0dd	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051338	GREEN	1	LOST	-1	2026-09-22 11:08:35.978	2026-09-22 11:09:03.232
3d17c75c-4bcd-474c-ba7f-867148141014	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051338	BIG	1	LOST	-1	2026-09-22 11:08:35.263	2026-09-22 11:09:03.231
0c359ab3-2702-4bb3-8c66-93f2bfa84c87	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051339	SMALL	2	LOST	-2	2026-09-22 11:09:06.489	2026-09-22 11:09:32.734
3e4cfa8f-8733-4f54-9f4d-31879725c275	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051339	GREEN	2	WON	1.92	2026-09-22 11:09:07.708	2026-09-22 11:09:32.734
c3b89e0c-1673-48db-a27a-03ccf23ed1a5	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051340	GREEN	1	WON	0.96	2026-09-22 11:09:36.217	2026-09-22 11:10:02.774
ef15edca-e6eb-4bfc-a4d2-803111d60713	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051340	SMALL	4	WON	3.84	2026-09-22 11:09:35.486	2026-09-22 11:10:02.774
c987ffd4-e015-4ade-bea0-308625021dd9	88aa8492-f60b-40d1-a186-5fac5391d263	20260922100051341	GREEN	1	PENDING	\N	2026-09-22 11:10:05.248	2026-09-22 11:10:05.248
\.


--
-- Data for Name: BotInstance; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."BotInstance" (id, "userId", name, "endpointId", "wingoPhone", "wingoEmail", "wingoPasswordAuth", status, "createdAt", "updatedAt", settings, "currentBalance", "sessionLosses", "sessionWins") FROM stdin;
88aa8492-f60b-40d1-a186-5fac5391d263	1	Sourav	608bd0b4-af7e-4698-b55d-cf88d3c3736d	9056822671	\N	ede877c8ef6d66a11c9d11ab:e4ac85c77ec13a7e607a070957873770:82b3e9cbb1ac493576	STOPPED	2026-09-22 10:46:14.249	2026-09-22 11:10:07.452	{"games": ["B/S", "R/G"], "schedules": [{"id": "1790074307430", "strategyId": "591a69cc-2d9c-4879-86cd-ddde175c7436", "timeSlotId": "6dadb438-e6c1-46e3-946d-d7456d7dbdac"}]}	358.68	36	34
\.


--
-- Data for Name: BotSession; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."BotSession" (id, date, "timeSlotId", "timeSlotName", "strategyId", "strategyName", "initialBalance", "finalBalance", "totalWins", "totalLosses", status, "createdAt", "updatedAt", "botInstanceId") FROM stdin;
bb2a2512-f453-4edf-839e-7cd1036e0919	2026-09-16	6dadb438-e6c1-46e3-946d-d7456d7dbdac	gfxhjkl;	591a69cc-2d9c-4879-86cd-ddde175c7436	smart recovery	213.83	213.83	0	0	ACTIVE	2026-09-16 19:52:01.394	2026-09-16 19:52:08.167	\N
fe9df88e-9c4f-48fb-b2d3-fa7c3acc80bb	2026-09-16	6dadb438-e6c1-46e3-946d-d7456d7dbdac	gfxhjkl;	591a69cc-2d9c-4879-86cd-ddde175c7436	smart recovery	215.79	215.79	0	0	ACTIVE	2026-09-16 20:02:01.372	2026-09-16 20:02:02.722	\N
\.


--
-- Data for Name: NetworkEndpoint; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."NetworkEndpoint" (id, "userId", name, host, port, "proxyUser", "proxyPass", "isActive", "createdAt", "updatedAt") FROM stdin;
608bd0b4-af7e-4698-b55d-cf88d3c3736d	1	Webshare UK 1	31.59.20.176	6754	ogrwagjj	296rlf48nfrr	t	2026-09-22 10:45:16.017	2026-09-22 10:45:16.017
\.


--
-- Data for Name: Strategy; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."Strategy" (id, name, "minLevel", "maxLevel", "maxWins", "maxLosses", levels, config, "createdAt", "updatedAt") FROM stdin;
591a69cc-2d9c-4879-86cd-ddde175c7436	smart recovery	1	15	100	50	{1,3,6,12,24,49,100,205,418,854,1743,3549,7266,14835,30288}	{"BET_BIG_SMALL": true, "BET_RED_GREEN": true, "ALLOWED_QUALITIES": ["A", "B"]}	2026-09-16 06:59:01.774	2026-09-22 07:09:42.73
\.


--
-- Data for Name: TimeSlot; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."TimeSlot" (id, name, "startTime", "endTime", "createdAt", "updatedAt") FROM stdin;
6dadb438-e6c1-46e3-946d-d7456d7dbdac	time1	01:00	18:00	2026-09-16 06:45:35.141	2026-09-22 08:36:30.41
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: sourav
--

COPY public."User" (id, username, "passwordHash", role, "createdAt", "updatedAt") FROM stdin;
1	admin	dummy	ADMIN	2026-09-21 17:18:54.139	2026-09-21 17:18:54.139
\.


--
-- Name: BetRecord BetRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BetRecord"
    ADD CONSTRAINT "BetRecord_pkey" PRIMARY KEY (id);


--
-- Name: BotInstance BotInstance_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BotInstance"
    ADD CONSTRAINT "BotInstance_pkey" PRIMARY KEY (id);


--
-- Name: BotSession BotSession_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BotSession"
    ADD CONSTRAINT "BotSession_pkey" PRIMARY KEY (id);


--
-- Name: NetworkEndpoint NetworkEndpoint_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."NetworkEndpoint"
    ADD CONSTRAINT "NetworkEndpoint_pkey" PRIMARY KEY (id);


--
-- Name: Strategy Strategy_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."Strategy"
    ADD CONSTRAINT "Strategy_pkey" PRIMARY KEY (id);


--
-- Name: TimeSlot TimeSlot_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."TimeSlot"
    ADD CONSTRAINT "TimeSlot_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: sourav
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: BetRecord BetRecord_botInstanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BetRecord"
    ADD CONSTRAINT "BetRecord_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES public."BotInstance"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BotInstance BotInstance_endpointId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BotInstance"
    ADD CONSTRAINT "BotInstance_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES public."NetworkEndpoint"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BotInstance BotInstance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BotInstance"
    ADD CONSTRAINT "BotInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BotSession BotSession_botInstanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."BotSession"
    ADD CONSTRAINT "BotSession_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES public."BotInstance"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NetworkEndpoint NetworkEndpoint_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sourav
--

ALTER TABLE ONLY public."NetworkEndpoint"
    ADD CONSTRAINT "NetworkEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict zs2NsgSAajajtifZi6bDmQCNAZX4Y3GRmssYjhm4PN1Fc4GnTMwet1AVMRBGWGN

