create table users
(
    id bigint not null primary key,
    access_token     text not null,
    token_expires_at timestamp with time zone not null,
    refresh_token    text not null,
    user_token       text not null
);
