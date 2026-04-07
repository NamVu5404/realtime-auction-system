package com.namvu.realtimeauctionsystem.common.utils;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class MoneyUtils {

    private MoneyUtils() {
        /* This utility class should not be instantiated */
    }

    /**
     * Format currency to US standard: $1,234,567.89
     */
    public static String format(BigDecimal amount) {
        if (amount == null) {
            return "$0.00";
        }

        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        symbols.setGroupingSeparator(',');
        symbols.setDecimalSeparator('.');

        DecimalFormat df = new DecimalFormat("$#,##0.00", symbols);

        return df.format(amount);
    }
}
