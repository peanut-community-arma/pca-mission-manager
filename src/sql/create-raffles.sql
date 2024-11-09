create table raffles
(
    id integer primary key,
    title text not null,
    creator integer not null,
    token text not null,
    draw_amount integer not null,
    open boolean not null default true,
    created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create index open_raffles_idx on raffles (open);