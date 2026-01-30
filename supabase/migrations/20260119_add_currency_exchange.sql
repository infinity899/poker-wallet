-- Add currency exchange fields to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS original_result NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- Add currency exchange fields to tournaments table
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS original_buy_in NUMERIC,
ADD COLUMN IF NOT EXISTS original_fee NUMERIC,
ADD COLUMN IF NOT EXISTS original_winnings NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN sessions.original_currency IS 'The currency the user entered the result in';
COMMENT ON COLUMN sessions.original_result IS 'The result value in the original currency';
COMMENT ON COLUMN sessions.exchange_rate IS 'USD exchange rate at time of recording (1 original_currency = X USD)';

COMMENT ON COLUMN tournaments.original_currency IS 'The currency the user entered values in';
COMMENT ON COLUMN tournaments.original_buy_in IS 'Buy-in amount in original currency';
COMMENT ON COLUMN tournaments.original_fee IS 'Fee amount in original currency';
COMMENT ON COLUMN tournaments.original_winnings IS 'Winnings amount in original currency';
COMMENT ON COLUMN tournaments.exchange_rate IS 'USD exchange rate at time of recording (1 original_currency = X USD)';
