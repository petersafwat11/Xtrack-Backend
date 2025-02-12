class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // filter() {
  //   const queryObj = { ...this.queryString };
  //   const excludedFields = ["page", "sort", "limit", "fields"];
  //   excludedFields.forEach((el) => delete queryObj[el]);

  //   if (Object.keys(queryObj).length) {
  //     this.query.where(queryObj);
  //   }

  //   return this;
  // }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "searchValue", "or"];
    excludedFields.forEach((el) => delete queryObj[el]);
  
    // Handle basic filtering
    Object.keys(queryObj).forEach((key) => {
      if (Array.isArray(queryObj[key])) {
        this.query.whereIn(key, queryObj[key]);
      } else {
        this.query.where(key, queryObj[key]);
      }
    });
  
    // Handle search
    if (this.queryString.or && this.queryString.searchValue) {
      const searchFields = Array.isArray(this.queryString.or) 
        ? this.queryString.or 
        : [this.queryString.or];
      const searchValue = this.queryString.searchValue;
  
      this.query.andWhere((qb) => {
        searchFields.forEach((field, index) => {
          if (index === 0) {
            qb.whereILike(field, `%${searchValue}%`);
          } else {
            qb.orWhereILike(field, `%${searchValue}%`);
          }
        });
      });
    }
  
    return this;
  }
  
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query.orderByRaw(sortBy);
    } else {
      this.query.orderBy("id", "asc");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query.select(fields);
    } else {
      this.query.select("*");
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query.offset(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures; 
