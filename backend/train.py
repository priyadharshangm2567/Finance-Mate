import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

import joblib


# ============================
# Load Dataset
# ============================

df = pd.read_excel("../backend/dataset/transactions.xlsx")


print("Dataset Shape:")
print(df.shape)


print("\nFirst Rows:")
print(df.head())




df.drop_duplicates(inplace=True)




df.fillna(df.median(), inplace=True)






X = df.drop(
    "Next_Month_Expense",
    axis=1
)


y = df["Next_Month_Expense"]



# ============================
# Train Test Split
# ============================


X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,
    test_size=0.2,
    random_state=42

)



# ============================
# Model 1: Random Forest
# ============================


rf_model = RandomForestRegressor(

    n_estimators=300,

    max_depth=10,

    random_state=42

)


print("\nTraining Random Forest...")

rf_model.fit(
    X_train,
    y_train
)


rf_prediction = rf_model.predict(
    X_test
)



rf_r2 = r2_score(
    y_test,
    rf_prediction
)


print(
    "Random Forest R2:",
    rf_r2
)






xgb_model = XGBRegressor(

    n_estimators=500,

    learning_rate=0.03,

    max_depth=6,

    subsample=0.8,

    colsample_bytree=0.8,

    random_state=42

)


print("\nTraining XGBoost...")


xgb_model.fit(

    X_train,

    y_train

)



xgb_prediction = xgb_model.predict(
    X_test
)



xgb_r2 = r2_score(

    y_test,

    xgb_prediction

)


print(
    "XGBoost R2:",
    xgb_r2
)







if xgb_r2 > rf_r2:

    best_model = xgb_model

    model_name = "XGBoost"


else:

    best_model = rf_model

    model_name = "Random Forest"



print("\nBest Model:")
print(model_name)




final_prediction = best_model.predict(
    X_test
)



print("\nPerformance")

print(
    "MAE:",
    mean_absolute_error(
        y_test,
        final_prediction
    )
)


print(
    "RMSE:",
    np.sqrt(
        mean_squared_error(
            y_test,
            final_prediction
        )
    )
)


print(
    "R2 Score:",
    r2_score(
        y_test,
        final_prediction
    )
)



joblib.dump(

    {
        "model":best_model,

        "features":list(X.columns)

    },

    "expense_model.pkl"

)


print("\nModel Saved Successfully")
