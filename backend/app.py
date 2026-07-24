from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import shutil
import os

import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


genai.configure(
    api_key=GEMINI_API_KEY
)


app = FastAPI(
    title="FinMate AI API"
)




app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://finance-mate-one.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





expense_data = joblib.load(
    "expense_model.pkl"
)

expense_model = expense_data["model"]


@app.get("/")
def home():

    return {
        "message":"FinMate AI Backend Running"
    }



@app.post("/analyze-finance")
def analyze_finance(data:dict):


    income = data["income"]

    food = data["food"]

    shopping = data["shopping"]

    travel = data["travel"]

    bills = data["bills"]



    total_expense = (
        food +
        shopping +
        travel +
        bills
    )


    savings = income-total_expense



    savings_percentage = (
        savings/income
    )*100





    score = 50


    if savings_percentage > 30:
        score += 30

    elif savings_percentage > 15:
        score += 20


    if shopping > income*0.2:
        score -= 10



    score = max(
        0,
        min(score,100)
    )




    prediction_input = pd.DataFrame(
    [[
        income,
        food,
        shopping,
        bills,
        travel,
        data.get("entertainment",0),
        data.get("investments",0),
        savings,
        total_expense
    ]],
    columns=[
        "Monthly_Income",
        "Food_Expense",
        "Shopping_Expense",
        "Bills_Expense",
        "Travel_Expense",
        "Entertainment_Expense",
        "Investments",
        "Savings",
        "Total_Current_Expense"
    ]
)


    predicted_expense = float(expense_model.predict(
        prediction_input
    )[0])



    advice = []


    if shopping > food:
        advice.append(
            "Your shopping expense is high. Try reducing unnecessary purchases."
        )


    if savings_percentage < 20:
        advice.append(
            "Increase your savings rate."
        )


    if len(advice)==0:
        advice.append(
            "Your financial habits look healthy."
        )



    return {

        "total_expense":round(total_expense,2),

        "savings":round(savings,2),

        "health_score":score,

        "predicted_next_month_expense":
        round(float(predicted_expense),2),

        "advice":advice

    }





@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...)
):

    file_path = "uploaded_file"


    # Save uploaded file

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    # Read file

    if file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):

        df = pd.read_excel(file_path)

    elif file.filename.endswith(".csv"):

        df = pd.read_csv(file_path)

    else:

        return {
            "error": "Only CSV and Excel files are supported"
        }



    print("Uploaded Columns:")
    print(df.columns.tolist())



    # -------------------------------
    # CASE 1: Bank Statement Format
    # -------------------------------

    if (
        "Transaction Type" in df.columns
        and
        "Amount" in df.columns
        and
        "Category" in df.columns
    ):


        debit_df = df[
            df["Transaction Type"]
            .astype(str)
            .str.lower()
            ==
            "debit"
        ]


        total_spending = debit_df["Amount"].sum()



        category_breakdown = (
            debit_df
            .groupby("Category")["Amount"]
            .sum()
            .to_dict()
        )



    # -------------------------------
    # CASE 2: FinMate Dataset Format
    # -------------------------------

    elif all(
        col in df.columns
        for col in [
            "Food_Expense",
            "Shopping_Expense",
            "Bills_Expense",
            "Travel_Expense",
            "Entertainment_Expense"
        ]
    ):


        category_breakdown = {

            "Food":
            float(df["Food_Expense"].sum()),


            "Shopping":
            float(df["Shopping_Expense"].sum()),


            "Bills":
            float(df["Bills_Expense"].sum()),


            "Travel":
            float(df["Travel_Expense"].sum()),


            "Entertainment":
            float(df["Entertainment_Expense"].sum())

        }



        total_spending = sum(
            category_breakdown.values()
        )



    else:

        return {

            "error":
            "Unsupported file format. Upload bank statement or FinMate dataset."

        }




    # Find highest category

    if len(category_breakdown) > 0:

        top_category = max(
            category_breakdown,
            key=category_breakdown.get
        )

    else:

        top_category = "No Data"



    return {


        "total_spending":
        round(float(total_spending),2),



        "category_breakdown":
        category_breakdown,



        "highest_spending_category":
        top_category

    }

@app.post("/ai-advice")
def ai_advice(data:dict):


    prompt=f"""

You are a personal finance advisor.

Analyze this user's finance data.

Income:
{data['income']}

Expenses:
{data['expense']}

Savings:
{data['savings']}

Highest Spending Category:
{data['category']}


Give:
1. Financial health analysis
2. Saving suggestions
3. Future advice


Keep answer simple.

"""


    model=genai.GenerativeModel(
        "gemini-2.5-flash"
    )


    response=model.generate_content(
        prompt
    )


    return {

        "advice":
        response.text

    }