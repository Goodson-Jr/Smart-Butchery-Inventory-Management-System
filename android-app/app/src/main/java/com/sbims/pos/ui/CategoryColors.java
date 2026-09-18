package com.sbims.pos.ui;

import com.sbims.pos.R;
import java.util.Locale;

final class CategoryColors {

    private CategoryColors() {
    }

    static int colorRes(String categoryName) {
        if (categoryName == null) return R.color.cat_default;
        switch (categoryName.trim().toLowerCase(Locale.ROOT)) {
            case "beef":
                return R.color.cat_beef;
            case "chicken":
                return R.color.cat_chicken;
            case "pork":
                return R.color.cat_pork;
            default:
                return R.color.cat_default;
        }
    }
}
