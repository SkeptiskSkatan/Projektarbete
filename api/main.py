from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List



app = FastAPI()

DBtest = {}

class Item(BaseModel):
    id:int
    name:str
    description: str
    price: float
    on_offer: bool

@app.post("/items/", status_code=201)

def create_item(item: Item):
    if item.id in DBtest:
        raise HTTPException(status_code=400, detail = ("item already exits"))
    DBtest[item.id] = item
    return {"message" : "det fungera", "item": item}

@app.get("/items/", response_model=List[Item])

def find_all():
    return list(DBtest.values())

@app.get("/items/ {item_id}", response_model=Item)

def find_one(item_id: int):
    if item_id not in DBtest:
        raise HTTPException(status_code=404, detail= ("Item not found"))
    return DBtest[item_id]


@app.put("/items/{item_id}")

def update_value(item_id : int, updated_item : int):
    if item_id not in DBtest:
        raise HTTPException(status_code=404, detail= ("item not found"))
    DBtest[item_id] = updated_item
    return {"message" : "Det fungera", "item" : updated_item}

@app.delete("/items/ {item_id}")

def delete_item(item_id: int):
    if item_id not in DBtest:
        raise HTTPException(status_code=404, detail= ("Item not found"))
    del DBtest[item_id]
    return {"message" : "Värde raderat"}

