-- kollage database

CREATE DATABASE kollage WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';

ALTER DATABASE kollage OWNER TO postgres;

CREATE TABLE public.artworks (
    recid bigint NOT NULL,
    created timestamp with time zone DEFAULT now(),
    userid integer,
    tokenid character varying(64),
    taxon character varying(10),
    collectionid integer,
    name character varying(100),
    description character varying(500),
    image character varying(100),
    artwork character varying(100),
    metadata character varying(100),
    media character varying(10),
    royalties integer DEFAULT 0,
    beneficiary character varying(64),
    forsale boolean DEFAULT true,
    copies integer DEFAULT 0,
    original boolean DEFAULT false,
    masterid character varying(64),
    sold integer DEFAULT 0,
    price integer DEFAULT 0,
    tags character varying(100),
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    inactive boolean DEFAULT false
);

ALTER TABLE public.artworks OWNER TO postgres;

CREATE SEQUENCE public.artworks_recid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.artworks_recid_seq OWNER TO postgres;

ALTER SEQUENCE public.artworks_recid_seq OWNED BY public.artworks.recid;

CREATE TABLE public.collections (
    recid bigint NOT NULL,
    created timestamp with time zone DEFAULT now(),
    userid integer,
    name character varying(100),
    description character varying(500),
    image character varying(100),
    taxon character varying(10),
    nftcount integer DEFAULT 0,
    inactive boolean DEFAULT false
);

ALTER TABLE public.collections OWNER TO postgres;

CREATE SEQUENCE public.collections_recid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.collections_recid_seq OWNER TO postgres;

ALTER SEQUENCE public.collections_recid_seq OWNED BY public.collections.recid;

CREATE SEQUENCE public.collections_userid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.collections_userid_seq OWNER TO postgres;

ALTER SEQUENCE public.collections_userid_seq OWNED BY public.collections.userid;

CREATE TABLE public.offers (
    recid bigint NOT NULL,
    created timestamp with time zone DEFAULT now(),
    type smallint DEFAULT 0,
    sellerid integer,
    buyerid integer,
    artworkid integer,
    collectionid integer,
    masterid character varying(64),
    tokenid character varying(64),
    price integer DEFAULT 0,
    royalties integer DEFAULT 0,
    beneficiary character varying(64),
    rarity character varying(20),
    wallet character varying(64),
    offerid character varying(64),
    status smallint DEFAULT 0
);

ALTER TABLE public.offers OWNER TO postgres;

CREATE SEQUENCE public.offers_recid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.offers_recid_seq OWNER TO postgres;

ALTER SEQUENCE public.offers_recid_seq OWNED BY public.offers.recid;

CREATE TABLE public.users (
    recid bigint NOT NULL,
    created timestamp with time zone DEFAULT now(),
    name character varying(30),
    namex character varying(30),
    tagline character varying(500),
    avatar character varying(100),
    account character varying(64),
    token character varying(256),
    expires timestamp with time zone,
    verified boolean DEFAULT false,
    email character varying(100),
    isadmin boolean DEFAULT false,
    inactive boolean DEFAULT false
);

ALTER TABLE public.users OWNER TO postgres;

CREATE SEQUENCE public.users_recid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.users_recid_seq OWNER TO postgres;

ALTER SEQUENCE public.users_recid_seq OWNED BY public.users.recid;

ALTER TABLE ONLY public.artworks ALTER COLUMN recid SET DEFAULT nextval('public.artworks_recid_seq'::regclass);

ALTER TABLE ONLY public.collections ALTER COLUMN recid SET DEFAULT nextval('public.collections_recid_seq'::regclass);

ALTER TABLE ONLY public.offers ALTER COLUMN recid SET DEFAULT nextval('public.offers_recid_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN recid SET DEFAULT nextval('public.users_recid_seq'::regclass);

ALTER TABLE ONLY public.artworks ADD CONSTRAINT artworks_pkey PRIMARY KEY (recid);

ALTER TABLE ONLY public.collections ADD CONSTRAINT collections_pkey PRIMARY KEY (recid);

ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (recid);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (recid);

-- end