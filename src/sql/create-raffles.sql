create table raffles
(
    id bigint primary key generated always as identity,
    title text not null,
    creator bigint not null,
    token text not null,
    draw_amount integer not null,
    open boolean not null default true,
    created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create index on raffles (open);