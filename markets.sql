CREATE TABLE solana_account (
id BIGSERIAL PRIMARY KEY,
address CHAR(48)
);
CREATE UNIQUE INDEX ix_solana_account_address_1 ON solana_account(address);

CREATE OR REPLACE FUNCTION solana_account_id(act CHAR(40)) RETURNS BIGINT AS $$
DECLARE act_id BIGINT;
BEGIN
INSERT INTO solana_account (address) VALUES (act) ON CONFLICT DO NOTHING;
SELECT id INTO act_id FROM solana_account WHERE address=act;
RETURN act_id;
END
$$ LANGUAGE plpgsql;

CREATE TABLE solana_transaction (
id BIGSERIAL PRIMARY KEY,
sig VARCHAR(100)
);
CREATE UNIQUE INDEX ix_solana_transaction_sig_1 ON solana_transaction(sig);

CREATE OR REPLACE FUNCTION solana_tx_id(inp VARCHAR(100)) RETURNS BIGINT AS $$
DECLARE sig_id BIGINT;
BEGIN
INSERT INTO solana_transaction (sig) VALUES (inp) ON CONFLICT DO NOTHING;
SELECT id INTO sig_id FROM solana_transaction WHERE sig=inp;
RETURN sig_id;
END
$$ LANGUAGE plpgsql;

CREATE TABLE solana_market_transaction (
  transaction_id bigint PRIMARY KEY,
  market_id bigint not null,
  slot bigint default 0,
  ts timestamptz default timezone('utc', now())
);
CREATE INDEX ix_solana_market_transaction_market_1 ON solana_market_transaction (market_id, ts);
CREATE INDEX ix_solana_market_transaction_market_2 ON solana_market_transaction (market_id, transaction_id);
CREATE INDEX ix_solana_market_transaction_ts_1 ON solana_market_transaction (ts);
CREATE INDEX ix_solana_market_transaction_slot_1 ON solana_market_transaction (slot);

CREATE TABLE solana_market_event (
  id BIGSERIAL PRIMARY KEY,
  transaction_id bigint not null,
  log_index int not null,
  market_id bigint not null,
  slot bigint default 0,
  ts timestamptz default timezone('utc', now()),
  program_id bigint not null,
  event_name varchar(64),
  event_data json
);
CREATE UNIQUE INDEX ix_solana_market_event_tx_1 ON solana_market_event (transaction_id, log_index);
CREATE INDEX ix_solana_market_event_market_1 ON solana_market_event (market_id, ts);
CREATE INDEX ix_solana_market_event_market_2 ON solana_market_event (market_id, event_name, ts);
CREATE INDEX ix_solana_market_event_slot_1 ON solana_market_event (slot);
CREATE INDEX ix_solana_market_event_ts_1 ON solana_market_event (ts);

CREATE TABLE solana_market_ref (
  id BIGSERIAL PRIMARY KEY,
  transaction_id bigint not null,
  log_index int not null,
  market_id bigint not null,
  program_id bigint not null,
  user_id bigint not null,
  ts timestamptz default timezone('utc', now()),
  event_name varchar(64),
  data_key varchar(32)
);
CREATE UNIQUE INDEX ix_solana_market_ref_tx_1 ON solana_market_ref (transaction_id, log_index, data_key);
CREATE INDEX ix_solana_market_ref_user_1 ON solana_market_ref (user_id, ts);
CREATE INDEX ix_solana_market_ref_user_2 ON solana_market_ref (user_id, event_name, data_key, ts);
CREATE INDEX ix_solana_market_ref_mkt_1 ON solana_market_ref (market_id, ts);

