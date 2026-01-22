using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RT_API.Migrations
{
    /// <inheritdoc />
    public partial class AddDayToTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Kolon zaten varsa hata vermemesi için SQL ile kontrol ediyoruz
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'tasks' AND column_name = 'day'
                    ) THEN
                        ALTER TABLE tasks ADD COLUMN day text;
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "day",
                table: "tasks");
        }
    }
}
