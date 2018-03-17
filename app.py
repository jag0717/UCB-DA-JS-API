
# coding: utf-8

# In[1]:


# Import SQLAlchemy `automap` and other dependencies here
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, inspect
from sqlalchemy import MetaData
from sqlalchemy import Table
from sqlalchemy import desc
from sqlalchemy import func

from flask import Flask, render_template, jsonify

import pandas as pd
import numpy as np


# In[2]:


#################################################
# Flask Setup
#################################################
app = Flask(__name__)


# In[3]:


#################################################
# Database Setup
#################################################
engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")
print("Connected to DB")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)
print("Reflected tables")

# Create our session (link) from Python to the DB
session = Session(bind=engine)

print(Base.classes.keys())


# In[4]:


# Save reference to the table
Otu = Base.classes.otu
Samples = Base.classes.samples
Samples_metadata = Base.classes.samples_metadata


# In[5]:


# Create a MetaData instance
metadata = MetaData()

# reflect db schema to MetaData
metadata.reflect(bind=engine)


# In[ ]:


@app.route("/")
def home():
    """Return the dashboard homepage."""
    return render_template("index.html")

@app.route('/names')
def names():
    """Return List of names."""
    sample_names = metadata.tables['samples'].columns.keys()
    names = sample_names[1:len(sample_names)]
    print('Samples Count: ' + str(len(names)))
    return jsonify(names)

@app.route('/otu')
def otu_desc():
    """List of OTU descriptions."""
    results = session.query(Otu.otu_id, Otu.lowest_taxonomic_unit_found).all()
    temp = []

    for otu in results:
        otu_dict = {}
        otu_dict["otu_id"] = otu.otu_id
        otu_dict["desc"] = otu.lowest_taxonomic_unit_found
        temp.append(otu_dict)
        
    return jsonify(temp)

@app.route('/metadata/<sample>')
def sample_meta(sample):
    """MetaData for a given sample."""
    print('sample:'+ sample)
    sample_id = sample.split('_')[1]
    sample_metadata = session.query(Samples_metadata).filter(Samples_metadata.SAMPLEID == sample_id).first().__dict__
    sample_metadata.pop('_sa_instance_state', None)
    return jsonify(sample_metadata)

@app.route('/wfreq/<sample>')
def sample_wfreq(sample):
    """Weekly Washing Frequency as a number."""
    sample_id = sample.split('_')[1]
    wfreq = session.query(Samples_metadata.WFREQ).filter(Samples_metadata.SAMPLEID == sample_id).first()[0]
    print('wfreq:' + str(wfreq))
    return jsonify(wfreq)

@app.route('/samples/<sample>')
def otu_samples(sample):
    """OTU IDs and Sample Values for a given sample."""
    # print('OTU sample:'+ sample)
    samples_df = pd.read_csv('DataSets/belly_button_biodiversity_samples.csv')
    temp_df = samples_df[['otu_id', sample]]
    temp_df = temp_df.loc[temp_df[sample] > 0]
    temp_df = temp_df.sort_values(by=sample, ascending=False)    
    otu_id = list(temp_df['otu_id'])
    sample_values = list(temp_df[sample])
    
    sample_dict = {"otu_ids":otu_id, "sample_values": sample_values}
    # print(sample_dict)
    return jsonify(sample_dict)


# In[ ]:


if __name__ == "__main__":
    app.run()

