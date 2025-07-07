class Season {
    constructor({ season_id, name, start_date, end_date, year, description, created_at }) {
        this.seasonId = season_id;
        this.name = name;
        this.startDate = start_date;
        this.endDate = end_date;
        this.year = year;
        this.description = description;
        this.createdAt = created_at;
    }

    toJSON() {
        return {
            seasonId: this.seasonId,
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate,
            year: this.year,
        };
    }
}

module.exports = Season;
