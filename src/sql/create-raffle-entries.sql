create table raffle_entries
(
    raffle_id integer not null references raffles(id),
    participant integer not null,
    chosen boolean not null default false,

    primary key (raffle_id, participant)
);
