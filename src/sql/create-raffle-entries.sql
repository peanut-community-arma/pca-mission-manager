create table raffle_entries
(
    raffle_id bigint not null references raffles(id),
    participant bigint not null,
    chosen boolean not null default false,

    primary key (raffle_id, participant)
);
