package com.namvu.realtimeauctionsystem.common.utils;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class MoneyUtils {

    private MoneyUtils() {
        /* This utility class should not be instantiated */
    }

    private static final Locale VN_LOCALE = Locale.of("vi", "VN");

    /**
     * Format số tiền theo định dạng: 1.200.000,00
     */
    public static String format(BigDecimal amount) {
        if (amount == null) {
            return "0,00";
        }

        DecimalFormatSymbols symbols = new DecimalFormatSymbols(VN_LOCALE);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');

        DecimalFormat df = new DecimalFormat("#,##0.00", symbols);

        return df.format(amount);
    }
}
